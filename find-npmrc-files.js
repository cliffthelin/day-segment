import { promises as fs } from "fs"
import path from "path"

async function findFiles(dir, pattern) {
  const files = await fs.readdir(dir, { withFileTypes: true })

  let results = []

  for (const file of files) {
    const filePath = path.join(dir, file.name)

    if (file.isDirectory()) {
      // Skip node_modules and .git directories to avoid excessive searching
      if (file.name !== "node_modules" && file.name !== ".git") {
        results = results.concat(await findFiles(filePath, pattern))
      }
    } else if (file.name.match(pattern)) {
      results.push(filePath)
    }
  }

  return results
}

async function main() {
  try {
    console.log("Searching for .npmrc files...")
    const npmrcFiles = await findFiles(".", /\.npmrc$/)

    console.log("Found .npmrc files:")
    for (const file of npmrcFiles) {
      console.log(`- ${file}`)

      // Read and display file contents
      const content = await fs.readFile(file, "utf8")
      console.log(`\nContents of ${file}:`)
      console.log(content)

      // Check for use-node-version
      if (content.includes("use-node-version")) {
        console.log(`\n⚠️ WARNING: Found "use-node-version" in ${file}`)
      }
    }

    if (npmrcFiles.length === 0) {
      console.log("No .npmrc files found.")
    }
  } catch (error) {
    console.error("Error:", error)
  }
}

main()
