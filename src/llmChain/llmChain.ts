import { PromptTemplate } from "@langchain/core/prompts";

const promptTemplate = new PromptTemplate({
  template:
    "Describe the importance of {course} for a {role}. Limit the output to {wordLimit} words.",
  inputVariables: ["course", "role", "wordLimit"],
});

async function main() {
  const response = await promptTemplate.format({
    course: "Artificial Intelligence",
    role: "Software Engineer",
    wordLimit: 100,
  });
  console.log(`Response: ${response}`);
}

main()
  .then(() => console.log("Done"))
  .catch((error) => console.error("Error:", error));
