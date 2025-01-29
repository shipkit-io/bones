"use server";

import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import crypto from "crypto";

interface SectionHistory {
    id: string;          // Unique identifier for the section
    originalContent: string;  // Original content when first seen
    currentContent: string;   // Current content
    lastModified: string;    // ISO date string
    path: string[];          // Array of headings leading to this section
}

interface FileHistory {
    filePath: string;
    sections: SectionHistory[];
    lastModified: string;
}

const HISTORY_DIR = path.join(process.cwd(), ".content-history");

/**
 * Generate a stable ID for a section based on its path and original content
 */
function generateSectionId(path: string[], content: string): string {
    const input = `${path.join("/")}:${content}`;
    return crypto.createHash("md5").update(input).digest("hex");
}

/**
 * Parse MDX content into sections based on headings
 */
function parseSections(content: string): { path: string[]; content: string }[] {
    const lines = content.split("\n");
    const sections: { path: string[]; content: string }[] = [];
    let currentPath: string[] = [];
    let currentContent: string[] = [];

    function addSection() {
        if (currentContent.length > 0) {
            sections.push({
                path: [...currentPath],
                content: currentContent.join("\n"),
            });
            currentContent = [];
        }
    }

    for (const line of lines) {
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            addSection();
            const level = headingMatch[1].length;
            const heading = headingMatch[2];
            currentPath = currentPath.slice(0, level - 1);
            currentPath[level - 1] = heading;
            currentContent.push(line);
        } else {
            currentContent.push(line);
        }
    }

    addSection();
    return sections;
}

/**
 * Initialize or update history for a file
 */
export async function trackContentChanges(filePath: string, content: string) {
    // Ensure history directory exists
    if (!existsSync(HISTORY_DIR)) {
        await fs.mkdir(HISTORY_DIR);
    }

    const historyPath = path.join(HISTORY_DIR, `${path.basename(filePath)}.json`);
    let history: FileHistory;

    try {
        if (existsSync(historyPath)) {
            const historyContent = await fs.readFile(historyPath, "utf-8");
            history = JSON.parse(historyContent);
        } else {
            history = {
                filePath,
                sections: [],
                lastModified: new Date().toISOString(),
            };
        }
    } catch (error) {
        console.error("Error reading history:", error);
        history = {
            filePath,
            sections: [],
            lastModified: new Date().toISOString(),
        };
    }

    const sections = parseSections(content);

    // Update sections
    for (const section of sections) {
        const sectionId = generateSectionId(section.path, section.content);
        const existingSection = history.sections.find((s) => s.id === sectionId);

        if (!existingSection) {
            // New section
            history.sections.push({
                id: sectionId,
                originalContent: section.content,
                currentContent: section.content,
                lastModified: new Date().toISOString(),
                path: section.path,
            });
        } else if (existingSection.currentContent !== section.content) {
            // Section changed
            existingSection.currentContent = section.content;
            existingSection.lastModified = new Date().toISOString();
        }
    }

    // Remove sections that no longer exist
    const currentSectionIds = sections.map((s) =>
        generateSectionId(s.path, s.content)
    );
    history.sections = history.sections.filter((s) =>
        currentSectionIds.includes(s.id)
    );

    history.lastModified = new Date().toISOString();

    // Save history
    await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
    return history;
}

/**
 * Get history for a file
 */
export async function getContentHistory(filePath: string): Promise<FileHistory> {
    const historyPath = path.join(HISTORY_DIR, `${path.basename(filePath)}.json`);

    if (!existsSync(historyPath)) {
        return {
            filePath,
            sections: [],
            lastModified: new Date().toISOString(),
        };
    }

    const historyContent = await fs.readFile(historyPath, "utf-8");
    return JSON.parse(historyContent);
}

/**
 * Revert a specific section to its original content
 */
export async function revertSection(
    filePath: string,
    sectionId: string
): Promise<string> {
    const history = await getContentHistory(filePath);
    const section = history.sections.find((s) => s.id === sectionId);

    if (!section) {
        throw new Error("Section not found");
    }

    const content = await fs.readFile(filePath, "utf-8");
    const sections = parseSections(content);

    // Find the section to revert
    const currentSectionIndex = sections.findIndex(
        (s) => generateSectionId(s.path, s.content) === sectionId
    );

    if (currentSectionIndex === -1) {
        throw new Error("Section not found in current content");
    }

    // Replace the section content
    sections[currentSectionIndex] = {
        path: section.path,
        content: section.originalContent,
    };

    // Rebuild the content
    const newContent = sections.map((s) => s.content).join("\n\n");
    await fs.writeFile(filePath, newContent);

    return newContent;
}
