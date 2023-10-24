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

    const context = github.context;
    console.log(context);
    const octokit = github.getOctokit(github_token);
    const pull_request_number = context.payload.pull_request.number;
    console.log(pull_request_number);

     const files = await octokit.rest.pulls.listFiles({
        ...context.repo.owner,
        ...context.repo,
        pull_number: pull_request_number
      });

    console.log('Files: ' + JSON.stringify(files));
    let changes = '';
    for(const data of files.data) {
      console.log(data.patch);
      changes+=data.patch;
    }

    const data = {
      messages: [
        {
          role: "system",
          content:
          `You are an AI Assistant that's an expert at reviewing pull requests. Review the below pull request that you receive between the exclamation marks. 
          Output the review in markdown format.    
          For example:    
          ### <Filename>    
          <proposed changes in git diff format>    
          <explanation of changes>    
          If there are no changes write 'No Comment' 
          ------------
             
          Input format
          - The input format follows Github diff format with addition and subtraction of code.
          - The + sign means that code has been added.
          - The - sign means that code has been removed.
          Instructions
          - Take into account that you don't have access to the full code but only the code diff.
          - Only answer on what can be improved and provide the improvement in code.
          - Answer in short form.\n- Include code snippets if necessary.
          - Adhere to the languages code conventions.
          !!!${changes}!!!`,
        },
      ],
      max_tokens: 800,
      temperature: 0,
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
    console.log(JSON.stringify(results.choices[0].message.content));

    await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: pull_request_number,
      body: results.choices[0].message.content,
    });
  } catch (error) {
    core.setFailed(error.message);
    console.log(error.message);
  }
};
run();
