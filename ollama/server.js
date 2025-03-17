const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = 3000;
const OLLAMA_URL = "http://localhost:11434/api/generate";

const MODEL = "mistral";

app.use(bodyParser.json());

const CODEQL_PROMPT = `
You are a security code analysis assistant. When given CodeQL findings, your job is to provide a concise, direct analysis.

I'll provide:
- CodeQL output
- The file where the finding was detected
- The description of the query (what it's searching for)
- Additional documentation about the vulnerability

You must respond with ONLY:
1. A brief summary (2-3 sentences) of the issue and its location
2. A concise explanation (3-5 sentences) of why this issue occurred
3. A suggested code fix

Format your response using this exact structure:
### Summary
[Your concise summary of what happened and where]

### Root Cause
[Your focused explanation of why it happened]

### Suggested Fix
\`\`\`
[code]
// Your suggested fixed code snippet
\`\`\`
Do not include introductions, conclusions, or any text outside these three sections. Be technical but clear. For the fix, provide only the relevant snippet, not the entire file.
  `;

const FUZZING_PROMPT =
  "Review this technical output from the fuzzing program and summarize the key findings: ";

// Function to get the vulnerability documentation
async function getVulnerabilityDocs(detectorName) {
  try {
    const docPath = path.join(__dirname, 'vulnerabilities', `${detectorName}.md`);
    const docs = await fs.readFile(docPath, 'utf8');
    return docs;
  } catch (error) {
    console.warn(`Documentation not found for ${detectorName}: ${error.message}`);
    return "No additional documentation available.";
  }
}

// Function to get the file content from a file path
async function getFileContent(filePath) {
  try {
    // Clean the file path (remove any problematic characters)
    const cleanPath = filePath.replace(/^C:\/Users\/[^\/]+\//, '');
    const localPath = path.join(__dirname, cleanPath);
    
    const content = await fs.readFile(localPath, 'utf8');
    return content;
  } catch (error) {
    console.warn(`File not found: ${filePath}: ${error.message}`);
    return "File content not available.";
  }
}

// Function to send data to Ollama and get the response
async function getOllamaResponse(prompt, model) {
  try {
    const response = await axios.post(
      OLLAMA_URL,
      {
        model: model,
        prompt: prompt,
        stream: false,
      }
    );
    
    return response.data.response;
  } catch (error) {
    console.error(`Error getting response from Ollama:`, error);
    throw error;
  }
}

// Main function to process CodeQL findings
async function processCodeQLFindings(findings) {
  const results = [];
  
  // Process each detector
  for (const [detectorName, queryResults] of Object.entries(findings)) {
    console.log(`\nProcessing detector: ${detectorName}`);
    
    // Get vulnerability documentation
    const vulnerabilityDocs = await getVulnerabilityDocs(detectorName);
    
    // Get column names
    const columns = queryResults.columns.map(col => col.name);
    
    // Process each tuple/finding
    for (let i = 0; i < queryResults.tuples.length; i++) {
      const tuple = queryResults.tuples[i];
      console.log(`Processing finding ${i+1} of ${queryResults.tuples.length}`);
      
      // Extract file path and get file content
      const filePath = tuple[0];
      const fileContent = await getFileContent(filePath);
      
      // Create a formatted finding
      let formattedFinding = `DETECTOR: ${detectorName}\n\n`;
      formattedFinding += `DOCUMENTATION:\n${vulnerabilityDocs}\n\n`;
      formattedFinding += `FILE: ${filePath}\n\n`;
      formattedFinding += `FILE CONTENT:\n${fileContent}\n\n`;
      formattedFinding += `FINDING DETAILS:\n`;
      
      // Map columns to values
      for (let j = 0; j < columns.length; j++) {
        formattedFinding += `${columns[j]}: ${tuple[j]}\n`;
      }
      
      // Create full prompt for this finding
      const fullPrompt = CODEQL_PROMPT + formattedFinding;
      
      // Get response from Ollama
      console.log(`Sending to Ollama...`);
      const ollamaResponse = await getOllamaResponse(fullPrompt, MODEL);
      
      // Print the response
      console.log(`\n==== OLLAMA RESPONSE FOR ${detectorName} (Finding ${i+1}) ====`);
      console.log(ollamaResponse);
      console.log("========================================\n");
      
      // Add to results
      results.push({
        detector: detectorName,
        finding: tuple,
        response: ollamaResponse
      });
    }
  }
  
  return results;
}

app.post("/codeql", async (req, res) => {
  try {
    const programOutput = req.body.output;

    if (!programOutput) {
      return res.status(400).json({ error: "Missing output data" });
    }

    console.log("\n==== RECEIVED CODEQL OUTPUT ====");
    
    // Extract the results from the output
    const results = programOutput.results || programOutput;
    
    // Process all findings
    const processedResults = await processCodeQLFindings(results);
    
    // Send response back to client
    res.json({ 
      status: "success", 
      message: "All CodeQL findings processed successfully",
      results: processedResults
    });
  } catch (error) {
    console.error("Error processing CodeQL request:", error);
    res.status(500).json({
      error: "Failed to process request",
      details: error.message,
    });
  }
});

// Keep the fuzzing endpoint as is
app.post("/fuzzing", async (req, res) => {
  try {
    const programOutput = req.body.output;

    if (!programOutput) {
      return res.status(400).json({ error: "Missing output data" });
    }

    // Format fuzzing output if it's an object
    let formattedOutput;
    if (typeof programOutput === "object") {
      formattedOutput = JSON.stringify(programOutput, null, 2);
    } else {
      formattedOutput = programOutput;
    }

    const fullPrompt = FUZZING_PROMPT + formattedOutput;

    console.log("\n==== RECEIVED OUTPUT FROM PROGRAM 2 (Fuzzing) ====");
    console.log(formattedOutput);

    const ollamaResponse = await getOllamaResponse(fullPrompt, MODEL);
    console.log("\n==== OLLAMA RESPONSE FOR FUZZING ====");
    console.log(ollamaResponse);
    console.log("========================================\n");

    res.json({ status: "success", message: "Output processed successfully" });
  } catch (error) {
    console.error("Error processing Fuzzing request:", error);
    res.status(500).json({
      error: "Failed to process request",
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Ollama proxy server running on port ${PORT}`);
  console.log(`CodeQL endpoint: http://localhost:${PORT}/codeql`);
  console.log(`Fuzzing endpoint: http://localhost:${PORT}/fuzzing`);
  console.log(`Forwarding requests to Ollama at: ${OLLAMA_URL}`);
  console.log(`Responses will be printed to this console\n`);
});