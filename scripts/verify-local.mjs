const webUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4200";

async function readJson(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`${response.url} failed with ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function main() {
  const health = await fetch(`${apiUrl}/health`).then(readJson);
  const project = {
    id: `verify-${Date.now()}`,
    name: "Axe verification scene",
    objects: [],
    keyframes: [],
    uiBlocks: [],
    duration: 4,
    updatedAt: new Date().toISOString(),
  };

  await fetch(`${apiUrl}/project`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  }).then(readJson);

  const loaded = await fetch(`${apiUrl}/project/${project.id}`).then(readJson);
  const projects = await fetch(`${apiUrl}/projects`).then(readJson);
  const html = await fetch(webUrl).then((response) => {
    if (!response.ok) {
      throw new Error(`${webUrl} failed with ${response.status}`);
    }

    return response.text();
  });

  const requiredHeadTags = [
    'rel="manifest"',
    'rel="icon"',
    'property="og:title"',
    'name="twitter:card"',
    "Axe - 3D Website Builder",
  ];
  const missingHeadTags = requiredHeadTags.filter((tag) => !html.includes(tag));

  if (missingHeadTags.length > 0) {
    throw new Error(`Missing metadata tags: ${missingHeadTags.join(", ")}`);
  }

  if (loaded.project.id !== project.id) {
    throw new Error("Loaded project id did not match saved project id");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        webUrl,
        apiUrl,
        persistence: health.persistence,
        projectId: loaded.project.id,
        projectCount: projects.projects.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
