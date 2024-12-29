Error: Mismatching "lexical" dependency versions found: lexical@0.20.2 (Please change this to 0.20.0), @lexical/list@0.22.0 (Please change this to 0.20.0). All "lexical" packages must have the same version. This is an error with your set-up, not a bug in Payload. Please go to your package.json and ensure all "lexical" packages have the same version

## Solution

Remove the carets `^` from the packages in your `package.json` file.

```json
"@lexical/list": "0.20.0",
"lexical": "0.20.0"
```
