const core = require("@actions/core");
const github = require("@actions/github");

const run = async () => {
  try {
    // 'who-to-greet' input defined in action metadata file
    const nameToGreet = core.getInput("who-to-greet");
    console.log(`Hello ${nameToGreet}!`);
    const time = new Date().toTimeString();
    core.setOutput("time", time);
    const github_token = process.env.GITHUB_TOKEN;
    // Get the JSON webhook payload for the event that triggered the workflow
    //const payload = JSON.stringify(github.context.payload, undefined, 2);
    //console.log(`The event payload: ${payload}`);

    const data = {
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that helps people find information.",
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
      frequency_penalty: 0,
      presence_penalty: 0,
      top_p: 0.95,
      stop: null,
    };
    const response = await fetch(
      process.env.AZURE_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.OPENAI_API_KEY,
        },
        body: JSON.stringify(data), // body data type must match "Content-Type" header
      }
    );
    const results = await response.json();
    console.log(results);
    console.log(JSON.stringify(results.choices[0].message));

    const context = github.context;
    const octokit = github.getOctokit(github_token);
    const pull_request_number = context.payload.pull_request.number;
    console.log(pull_request_number);
    await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: pull_request_number,
      body: `Hello ${nameToGreet}!\n${results.choices[0].message}`,
    });
  } catch (error) {
    core.setFailed(error.message);
    console.log(error.message);
  }
};
run();
