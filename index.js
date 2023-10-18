const core = require("@actions/core");
const github = require("@actions/github");

const run = async () => {
    try {
        // 'who-to-greet' input defined in action metadata file
        const nameToGreet = core.getInput("who-to-greet");
        console.log(`Hello ${nameToGreet}!`);
        const time = new Date().toTimeString();
        core.setOutput("time", time);
        const github_token = core.getInput('GITHUB_TOKEN');
        console.log(github_token.length)
        // Get the JSON webhook payload for the event that triggered the workflow
        //const payload = JSON.stringify(github.context.payload, undefined, 2);
        //console.log(`The event payload: ${payload}`);
      
        const context = github.context;
        const { issue } = context;
        const octokit = github.getOctokit(github_token);
        const { owner, repo, pull_number } = issue;
        await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: pull_number,
          body: `Hello ${nameToGreet}!`
        })
      } catch (error) {
        core.setFailed(error.message);
        console.log(error.message);
      }
}
run();
