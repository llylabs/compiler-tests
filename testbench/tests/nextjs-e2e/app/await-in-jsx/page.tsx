// Multiple awaits inside try/catch + inside async fn body
async function loadProfile(id) {
  return Promise.resolve({ id, name: "User-" + id, age: 25 });
}

async function loadPrefs(id) {
  return Promise.resolve({ theme: "dark", lang: "en", notifications: true });
}

async function loadPermissions(id) {
  return Promise.resolve(["read", "write", "delete"]);
}

export default async function AwaitInJsxPage({ params, searchParams }) {
  const sp = searchParams || {};
  const id = sp.uid || "alice";

  var profile, prefs, perms;
  try {
    profile = await loadProfile(id);
    prefs = await loadPrefs(id);
    perms = await loadPermissions(id);
  } catch (e) {
    profile = { id, name: "Error", age: 0 };
    prefs = {};
    perms = [];
  }

  return (
    <div>
      <h1>Profile: {profile.name}</h1>
      <p>Age: {profile.age}</p>
      <p>Theme: {prefs.theme}</p>
      <p>Lang: {prefs.lang}</p>
      <p>Permissions: {perms.join(", ")}</p>
    </div>
  );
}
