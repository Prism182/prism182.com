export default {
  async fetch(request, env) {
    const query = `
    {
      viewer {
        repositories(first: 100, ownerAffiliations: OWNER) {
          totalCount
          nodes {
            name
            languages(first: 10) {
              nodes {
                name
              }
            }
          }
        }
        contributionsCollection {
          totalCommitContributions
          restrictedContributionsCount
        }
      }
    }`;

    const githubResponse = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "cloudflare-worker"
      },
      body: JSON.stringify({ query })
    });

    const githubData = await githubResponse.json();
    
    if (githubData.errors) {
      return new Response(JSON.stringify({ error: githubData.errors }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const viewer = githubData.data.viewer;
    const repos = viewer.repositories.nodes ?? [];
    const projectCount = viewer.repositories.totalCount;

    // Language frequency calculation
    const languageCounts = {};
    repos.forEach(repo => {
      repo.languages?.nodes?.forEach(lang => {
        languageCounts[lang.name] = (languageCounts[lang.name] || 0) + 1;
      });
    });

    const languages = Object.entries(languageCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Total commits in the past year (including private ones if the token has access)
    const commits = viewer.contributionsCollection.totalCommitContributions + 
                    viewer.contributionsCollection.restrictedContributionsCount;

    return new Response(
      JSON.stringify({
        projects: projectCount,
        commits: commits,
        languages: languages
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, s-maxage=300"
        }
      }
    );
  }
}