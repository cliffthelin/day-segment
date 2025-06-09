import { promises as fs } from "fs"
import path from "path"

async function findAllNpmrcFiles(dir) {
  const results = []

  async function scan(directory) {
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name)

        if (entry.isDirectory()) {
          // Skip node_modules and .git to avoid excessive searching
          if (entry.name !== "node_modules" && entry.name !== ".git") {
            await scan(fullPath)
          }
        } else if (entry.name === ".npmrc" || entry.name.includes("npmrc")) {
          results.push(fullPath)

          // Read the file to check for the problematic directive
          try {
            const content = await fs.readFile(fullPath, "utf8")
            if (content.includes("use-node-version")) {
              console.log(`⚠️ FOUND PROBLEMATIC DIRECTIVE in ${fullPath}:`)
              console.log(content)
            } else {
              console.log(`Found .npmrc file at ${fullPath} (no problematic directive)`)
            }
          } catch (readErr) {
            console.error(`Error reading ${fullPath}:`, readErr)
          }
        }
      }
    } catch (err) {
      console.error(`Error scanning ${directory}:`, err)
    }
  }

  await scan(dir)
  return results
}

async function main() {
  console.log("Searching for .npmrc files...")
  const npmrcFiles = await findAllNpmrcFiles(".")

  if (npmrcFiles.length === 0) {
    console.log("✅ No .npmrc files found in the project.")
  } else {
    console.log(`Found ${npmrcFiles.length} .npmrc files:`)
    npmrcFiles.forEach((file) => console.log(`- ${file}`))
  }
}

main().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
