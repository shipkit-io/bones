#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status.
set -o pipefail # Causes pipelines to fail on the first command error.

# Check if OPENAI_API_KEY is set
if [[ -z "$OPENAI_API_KEY" ]]; then
  echo "::error::OPENAI_API_KEY environment variable is not set." >&2
  exit 1
fi

# --- Configuration ---
# Experiment with different models and providers as needed
OPENAI_MODEL="${OPENAI_MODEL:-gpt-4o}" # Allow overriding via env var
OPENAI_API_URL="${OPENAI_API_URL:-https://api.openai.com/v1/chat/completions}"
MAX_RETRIES=3
RETRY_DELAY=5 # seconds
# Set to true to allow the script to finish even if some files fail AI resolution
# The workflow will still create a PR, but it will contain unresolved conflicts.
ALLOW_PARTIAL_RESOLUTION=${ALLOW_PARTIAL_RESOLUTION:-false}

# --- Helper Functions ---

# Function to check if conflict markers are present
contains_conflict_markers() {
  grep -q -E ">>>>>>> |<<<<<<< |======="
}

# Function to call OpenAI API
call_openai() {
  local file_path="$1"
  local file_content="$2"
  local attempt=1

  # Escape JSON special characters in file content using jq for robustness
  local escaped_content
escaped_content=$(jq -R -s "." <<< "$file_content")
  if [[ $? -ne 0 || -z "$escaped_content" ]]; then
    echo "::error::Failed to escape file content for $file_path using jq." >&2
    return 1
  fi


  # Construct the prompt - More specific instructions
  local prompt_message
prompt_message=$(cat <<-PROMPT
You work for a company that uses a boilerplate codebase upstream, and the codebases have diverged considerably.
You are given a file with Git merge conflicts, and your job is to resolve the conflicts accurately and return only the resolved code.

Resolve the Git merge conflicts within the following file content from
'$file_path'.

Analyze the code within the conflict markers (<<<<<<<, =======, >>>>>>>).
Merge the changes logically, retaining necessary code from both 'ours' and 'theirs' sections.
Ensure the final code is syntactically correct and maintains the original functionality and indentation style.

IMPORTANT: Your response MUST contain *only* the fully resolved file content.
Do NOT include any explanations, introductory text, apologies, or summary.
Do NOT include the conflict markers themselves in the output.
Do NOT wrap the output in markdown code blocks (e.g., \
\
\
```code\
\
\
```).

File Content with Conflicts:
$escaped_content
PROMPT
)

  # Construct the JSON payload using jq for safety
  local data
data=$(jq -n --arg model "$OPENAI_MODEL" --arg prompt "$prompt_message" \
  '{ model: $model,
     messages: [
       { role: "system", content: "You are an expert programmer specializing in resolving Git merge conflicts accurately and returning only the resolved code." },
       { role: "user", content: $prompt }
     ],
     temperature: 0.1,
     max_tokens: 4000
   }')

  if [[ $? -ne 0 ]]; then
    echo "::error::Failed to construct JSON payload for OpenAI request for $file_path." >&2
    return 1
  fi

  while (( attempt <= MAX_RETRIES )); do
    echo "Attempting OpenAI API call (Attempt $attempt/$MAX_RETRIES) for $file_path..."
    local response
response=$(curl -s -f -X POST "$OPENAI_API_URL" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OPENAI_API_KEY" \
      -d "$data")
    local curl_exit_code=$?

    # Check for curl errors (including HTTP errors >= 400 due to -f)
    if [[ $curl_exit_code -ne 0 ]]; then
      echo "::warning::Curl command failed for $file_path with exit code $curl_exit_code on attempt $attempt." >&2
      # Print response if available, it might contain clues
      if [[ -n "$response" ]]; then
        echo "::debug::Curl response (error): $response"
      fi
      sleep $RETRY_DELAY
      ((attempt++))
      continue
    fi

    # Check for API errors explicitly in the JSON response (redundant with curl -f but safer)
    local error_message
error_message=$(echo "$response" | jq -r ".error.message // empty")
    if [[ -n "$error_message" ]]; then
      echo "::warning::OpenAI API Error for $file_path: $error_message (Attempt $attempt/$MAX_RETRIES)" >&2
      sleep $RETRY_DELAY
      ((attempt++))
      continue
    fi

    # Extract content safely using jq
    local resolved_content
resolved_content=$(echo "$response" | jq -r ".choices[0].message.content // empty")

    if [[ -n "$resolved_content" && "$resolved_content" != "null" ]]; then
       # Check if conflict markers are still present in the AI's response
       if echo "$resolved_content" | contains_conflict_markers; then
           echo "::warning::AI response for $file_path still contains conflict markers. Retrying (Attempt $attempt/$MAX_RETRIES)..." >&2
           echo "::debug::AI Response with markers: $(echo "$resolved_content" | head -n 5)..." # Log snippet
           sleep $RETRY_DELAY
           ((attempt++))
           continue
       fi

      # Optional: Add syntax validation here if possible for the file type
      # Example for JSON (requires jq):
      # if [[ "$file_path" == *.json ]] && ! echo "$resolved_content" | jq -e . > /dev/null; then
      #   echo "::warning::AI response for $file_path is not valid JSON. Retrying..." >&2
      #   sleep $RETRY_DELAY
      #   ((attempt++))
      #   continue
      # fi

      echo "Successfully received and validated resolved content for $file_path."
      # Log AI output to a dedicated file for verification
      echo "--- AI Output for $file_path ---" > ai_output.log
      printf "%s\n" "$resolved_content" >> ai_output.log
      echo "--- AI Resolved Content START ---"
      printf "%s\n" "$resolved_content"
      echo "--- AI Resolved Content END ---"
      echo "$resolved_content"
      return 0 # Success
    else
      echo "::warning::Empty or null content received from OpenAI API for $file_path (Attempt $attempt/$MAX_RETRIES)." >&2
      echo "::debug::Full API response: $response"
      sleep $RETRY_DELAY
      ((attempt++))
    fi
  done

  echo "::error::Failed to get valid resolved content from OpenAI API for $file_path after $MAX_RETRIES attempts." >&2
  return 1 # Failure
}

# --- Main Script Logic ---

echo "Starting conflict resolution process..."

# Find conflicted files
conflicted_files=$(git diff --name-only --diff-filter=U)

if [[ -z "$conflicted_files" ]]; then
  echo "No conflicted files found. Exiting conflict resolution script."
  exit 0
fi

echo "Found conflicted files:"
while IFS= read -r file; do
  echo "  - $file"
done <<< "$conflicted_files"

successful_resolutions=0
failed_resolutions=0
failed_files=""

# Process each conflicted file
while IFS= read -r file_path; do
  echo "----------------------------------------"
  echo "Processing conflict in: $file_path"

  # Read the conflicted content
  # Handle potential read errors
  file_content=$(cat "$file_path")
  if [[ $? -ne 0 ]]; then
    echo "::error::Failed to read file content for $file_path." >&2
    ((failed_resolutions++))
    failed_files+="$file_path (Read Error)\n"
    continue # Skip to the next file
  fi

  # Call OpenAI to resolve conflicts
  resolved_content=$(call_openai "$file_path" "$file_content")
  local exit_code=$?

  if [[ $exit_code -eq 0 && -n "$resolved_content" ]]; then
    # Write the resolved content back to the file
    echo "Writing resolved content back to $file_path"
    # Use printf to reliably write content, even if it starts with -
    if printf "%s" "$resolved_content" > "$file_path"; then
      # Stage the resolved file
      echo "Staging resolved file: $file_path"
      git add "$file_path"
      ((successful_resolutions++))
    else
      echo "::error::Failed to write resolved content to $file_path." >&2
      ((failed_resolutions++))
      failed_files+="$file_path (Write Error)\n"
      # Attempt to restore original conflicted state? Maybe too complex.
      git checkout -- "$file_path" # Revert potential partial write
    fi
  else
    echo "::error::AI failed to resolve conflicts for $file_path (Exit Code: $exit_code). Leaving file conflicted." >&2
    ((failed_resolutions++))
    failed_files+="$file_path (AI Resolution Failed)\n"
    # Ensure the conflicted file remains unstaged
    git reset "$file_path" > /dev/null 2>&1 || true
  fi
done <<< "$conflicted_files"

echo "----------------------------------------"
echo "Conflict resolution summary:"
echo "  Successfully resolved: $successful_resolutions"
echo "  Failed to resolve: $failed_resolutions"

# Exit with error if any resolution failed AND partial resolution is not allowed
if [[ $failed_resolutions -gt 0 ]]; then
  echo "::error::One or more files could not be automatically resolved:"
  printf "%b" "$failed_files"
  if [[ "$ALLOW_PARTIAL_RESOLUTION" != "true" ]]; then
     echo "Exiting with error because ALLOW_PARTIAL_RESOLUTION is not true."
     exit 1
  else
     echo "Continuing workflow because ALLOW_PARTIAL_RESOLUTION is true. PR will contain unresolved conflicts."
  fi
fi

echo "Conflict resolution script finished."
exit 0
