/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Converts a JSON string or object to XML
 */
export function jsonToXml(jsonStr: string): string {
  try {
    let obj = JSON.parse(jsonStr);
    
    // Wrap in a root element if it's not a single root object
    if (typeof obj !== "object" || obj === null) {
      return `<root>${obj}</root>`;
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    
    function toXml(val: any, nodeName: string, indent: string = ""): string {
      let result = "";
      if (val === null || val === undefined) {
        return `${indent}<${nodeName} />\n`;
      }
      
      if (Array.isArray(val)) {
        val.forEach((item) => {
          result += toXml(item, nodeName, indent);
        });
      } else if (typeof val === "object") {
        result += `${indent}<${nodeName}>\n`;
        Object.keys(val).forEach((key) => {
          // clean key for XML tag naming compliance
          const safeKey = key.replace(/[^a-zA-Z0-9_\-]/g, "_");
          result += toXml(val[key], safeKey, indent + "  ");
        });
        result += `${indent}</${nodeName}>\n`;
      } else {
        // Escape XML entities
        const safeVal = String(val)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;");
        result += `${indent}<${nodeName}>${safeVal}</${nodeName}>\n`;
      }
      return result;
    }

    const keys = Object.keys(obj);
    if (keys.length === 1 && typeof obj[keys[0]] === "object" && !Array.isArray(obj[keys[0]])) {
      // Use the single top level key as root
      xml += toXml(obj[keys[0]], keys[0]);
    } else {
      xml += toXml(obj, "root");
    }

    return xml.trim();
  } catch (err: any) {
    throw new Error("Invalid JSON input: " + err.message);
  }
}

/**
 * Converts simple XML to JSON
 */
export function xmlToJson(xmlStr: string): string {
  try {
    // Simple DOM parser in browser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlStr, "application/xml");
    
    // Check for parsing errors
    const parseError = xmlDoc.getElementsByTagName("parsererror");
    if (parseError.length > 0) {
      throw new Error(parseError[0].textContent || "XML parsing error");
    }

    function elementToObject(element: Element): any {
      const obj: any = {};
      const children = element.children;

      // Handle simple text nodes
      if (children.length === 0) {
        const text = element.textContent?.trim() || "";
        // Try parsing as number or boolean
        if (text === "true") return true;
        if (text === "false") return false;
        if (!isNaN(Number(text)) && text !== "") return Number(text);
        return text;
      }

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const nodeName = child.nodeName;
        const childValue = elementToObject(child);

        if (obj[nodeName] !== undefined) {
          // Convert to array if duplicate key exists
          if (!Array.isArray(obj[nodeName])) {
            obj[nodeName] = [obj[nodeName]];
          }
          obj[nodeName].push(childValue);
        } else {
          obj[nodeName] = childValue;
        }
      }

      // Add attributes if present
      if (element.attributes.length > 0) {
        obj["_attributes"] = {};
        for (let j = 0; j < element.attributes.length; j++) {
          const attr = element.attributes[j];
          obj["_attributes"][attr.name] = attr.value;
        }
      }

      return obj;
    }

    if (!xmlDoc.documentElement) {
      throw new Error("No root element found in XML");
    }

    const rootName = xmlDoc.documentElement.nodeName;
    const rootObj = {
      [rootName]: elementToObject(xmlDoc.documentElement)
    };

    return JSON.stringify(rootObj, null, 2);
  } catch (err: any) {
    throw new Error("XML Conversion Error: " + err.message);
  }
}

/**
 * Converts JSON to YAML
 */
export function jsonToYaml(jsonStr: string): string {
  try {
    const obj = JSON.parse(jsonStr);

    function toYaml(val: any, indent: string = ""): string {
      if (val === null || val === undefined) {
        return "null\n";
      }

      if (typeof val !== "object") {
        if (typeof val === "string") {
          // Quote strings with special characters
          if (/[:#[\]{}|&*>!@\-']/g.test(val) || val === "" || !isNaN(Number(val))) {
            return `"${val.replace(/"/g, '\\"')}"\n`;
          }
          return `${val}\n`;
        }
        return `${val}\n`;
      }

      if (Array.isArray(val)) {
        if (val.length === 0) return "[]\n";
        let yaml = "\n";
        val.forEach((item) => {
          const itemYaml = toYaml(item, indent + "  ");
          // Align correctly for array dash
          yaml += `${indent}- ${itemYaml.trimStart()}`;
        });
        return yaml;
      }

      // Object
      const keys = Object.keys(val);
      if (keys.length === 0) return "{}\n";
      let yaml = "\n";
      keys.forEach((key) => {
        const itemVal = val[key];
        const itemYaml = toYaml(itemVal, indent + "  ");
        if (typeof itemVal === "object" && itemVal !== null) {
          yaml += `${indent}${key}:${itemYaml}`;
        } else {
          yaml += `${indent}${key}: ${itemYaml.trimStart()}`;
        }
      });
      return yaml;
    }

    let result = "";
    if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
      Object.keys(obj).forEach((key) => {
        const val = obj[key];
        const valYaml = toYaml(val, "  ");
        if (typeof val === "object" && val !== null) {
          result += `${key}:${valYaml}`;
        } else {
          result += `${key}: ${valYaml.trimStart()}`;
        }
      });
    } else {
      result = toYaml(obj);
    }

    return result.trim();
  } catch (err: any) {
    throw new Error("Invalid JSON Input: " + err.message);
  }
}

/**
 * Converts Simple YAML to JSON
 */
export function yamlToJson(yamlStr: string): string {
  try {
    const lines = yamlStr.split(/\r?\n/);
    const root: any = {};
    const stack: { indent: number; obj: any; key?: string; isArray?: boolean }[] = [];

    // Simple YAML parser supporting primitive keys, lists, and basic indentation nesting
    let currentObj = root;
    let currentIndent = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim() || line.trim().startsWith("#")) continue;

      const match = line.match(/^(\s*)([^:]+)(?::\s*(.*))?$/);
      if (!match) continue;

      const indent = match[1].length;
      let key = match[2].trim();
      let val = match[3] ? match[3].trim() : undefined;

      // Handle arrays
      let isArrayItem = false;
      if (key.startsWith("- ")) {
        isArrayItem = true;
        key = key.substring(2).trim();
      }

      // Determine primitive value
      let typedVal: any = val;
      if (val !== undefined) {
        if (val === "null") typedVal = null;
        else if (val === "true") typedVal = true;
        else if (val === "false") typedVal = false;
        else if (!isNaN(Number(val)) && val !== "") typedVal = Number(val);
        else if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          typedVal = val.slice(1, -1);
        }
      }

      // Track scope via indentation stack
      if (indent > currentIndent) {
        // Nesting deeper
        stack.push({ indent: currentIndent, obj: currentObj });
        currentIndent = indent;
        
        // Let's create a new object or array
        const newObj = isArrayItem ? [] : {};
        if (stack.length > 1) {
          const parent = stack[stack.length - 2];
          if (parent.key) {
            parent.obj[parent.key] = newObj;
          }
        }
        currentObj = newObj;
      } else if (indent < currentIndent) {
        // Going back up
        while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
          const popped = stack.pop();
          if (popped) {
            currentObj = popped.obj;
            currentIndent = popped.indent;
          }
        }
      }

      // Assign properties
      if (isArrayItem) {
        if (!Array.isArray(currentObj)) {
          // Coerce to array
          currentObj = [];
        }
        if (val !== undefined) {
          currentObj.push(typedVal);
        } else {
          // Nested array object
          const nested = {};
          currentObj.push(nested);
          stack.push({ indent: currentIndent, obj: currentObj, key });
          currentObj = nested;
        }
      } else {
        if (val !== undefined) {
          currentObj[key] = typedVal;
        } else {
          // Complex key, will have children on subsequent lines
          stack.push({ indent: currentIndent, obj: currentObj, key });
        }
      }
    }

    // Unroll back to root
    if (stack.length > 0) {
      return JSON.stringify(stack[0].obj, null, 2);
    }

    return JSON.stringify(root, null, 2);
  } catch (err: any) {
    throw new Error("YAML Parsing Error: " + err.message);
  }
}

/**
 * Converts CSV to JSON
 */
export function csvToJson(csvStr: string): string {
  try {
    const lines = csvStr.trim().split(/\r?\n/);
    if (lines.length === 0 || !lines[0].trim()) {
      return "[]";
    }

    // Simple CSV parser supporting quotes
    function parseCsvRow(row: string): string[] {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    }

    const headers = parseCsvRow(lines[0]);
    const jsonList: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const row = parseCsvRow(lines[i]);
      const obj: any = {};
      headers.forEach((header, index) => {
        const cleanHeader = header.replace(/^"|"$/g, "");
        let val = row[index] !== undefined ? row[index].replace(/^"|"$/g, "") : "";
        
        // Auto convert types
        if (val === "true") obj[cleanHeader] = true;
        else if (val === "false") obj[cleanHeader] = false;
        else if (!isNaN(Number(val)) && val !== "") obj[cleanHeader] = Number(val);
        else obj[cleanHeader] = val;
      });
      jsonList.push(obj);
    }

    return JSON.stringify(jsonList, null, 2);
  } catch (err: any) {
    throw new Error("CSV Parsing Error: " + err.message);
  }
}

/**
 * Converts JSON array to CSV
 */
export function jsonToCsv(jsonStr: string): string {
  try {
    const parsed = JSON.parse(jsonStr);
    const list = Array.isArray(parsed) ? parsed : [parsed];
    if (list.length === 0) return "";

    // Dynamic header discovery
    const headersMap = new Set<string>();
    list.forEach((item) => {
      if (typeof item === "object" && item !== null) {
        Object.keys(item).forEach((k) => headersMap.add(k));
      }
    });

    const headers = Array.from(headersMap);
    if (headers.length === 0) {
      throw new Error("No properties found in JSON to convert to CSV");
    }

    let csv = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

    list.forEach((item) => {
      const row = headers.map((header) => {
        let val = item[header];
        if (val === undefined || val === null) return '""';
        if (typeof val === "object") val = JSON.stringify(val);
        
        const stringVal = String(val);
        // Quote cell if it has comma, quotes, or linebreaks
        if (/[",\n\r]/g.test(stringVal)) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      });
      csv += row.join(",") + "\n";
    });

    return csv.trim();
  } catch (err: any) {
    throw new Error("Invalid JSON input: " + err.message);
  }
}

/**
 * Custom Simple Markdown to HTML parser
 */
export function markdownToHtml(mdStr: string): string {
  try {
    const lines = mdStr.split(/\r?\n/);
    let html = "";
    let inList = false;

    lines.forEach((line) => {
      let trimmed = line.trim();

      // Check for lists
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        if (!inList) {
          html += "<ul>\n";
          inList = true;
        }
        let listContent = trimmed.substring(2);
        html += `  <li>${parseInlineMarkdown(listContent)}</li>\n`;
        return;
      } else {
        if (inList) {
          html += "</ul>\n";
          inList = false;
        }
      }

      // Check for headings
      if (trimmed.startsWith("#")) {
        const hashCount = (trimmed.match(/^#+/) || [""])[0].length;
        if (hashCount >= 1 && hashCount <= 6) {
          const text = trimmed.substring(hashCount).trim();
          html += `<h${hashCount}>${parseInlineMarkdown(text)}</h${hashCount}>\n`;
          return;
        }
      }

      // Check for code blocks
      if (trimmed.startsWith("```")) {
        // Toggle/simple rendering
        return;
      }

      // Standard paragraph
      if (trimmed) {
        html += `<p>${parseInlineMarkdown(trimmed)}</p>\n`;
      }
    });

    if (inList) {
      html += "</ul>\n";
    }

    return html.trim();
  } catch (err: any) {
    throw new Error("Markdown Parsing Error: " + err.message);
  }
}

/**
 * Replace inline Markdown (bold, italic, code) with HTML tags
 */
function parseInlineMarkdown(text: string): string {
  let result = text
    // Escape HTML special characters first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold (**text** or __text__)
  result = result.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__(.*?)__/g, "<strong>$1</strong>");

  // Italic (*text* or _text_)
  result = result.replace(/\*(.*?)\*/g, "<em>$1</em>");
  result = result.replace(/_(.*?)_/g, "<em>$1</em>");

  // Code (`code`)
  result = result.replace(/`(.*?)`/g, "<code>$1</code>");

  return result;
}
