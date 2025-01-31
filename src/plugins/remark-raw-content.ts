import type { Root } from "mdast";
import type { Plugin } from "unified";

interface Options {
    passThrough?: boolean;
}

interface RawContentData {
    __raw?: string;
    exports?: {
        __raw?: string;
    };
}

const remarkRawContent: Plugin<[Options?], Root> = (options = {}) => {
    return (tree, file) => {
        // Store the raw content in the data property
        const raw = String(file.value);
        const data = tree.data as RawContentData || {};
        tree.data = data;
        data.__raw = raw;

        // Also add it to the exports if we're passing through
        if (options.passThrough) {
            if (!data.exports) {
                data.exports = {};
            }
            data.exports.__raw = raw;
        }
    };
};

export default remarkRawContent;
