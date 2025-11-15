const SERVER_URL = "https://ext-irri-auth-server-production.up.railway.app";

document.getElementById("btnGen").addEventListener("click", async () => {
    const pass = document.getElementById("adminPass").value.trim();
    if (!pass) return alert("Enter password");

    const res = await fetch(`${SERVER_URL}/api/get-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass })
    });

    const data = await res.json();

    if (!data.ok) {
        alert("Invalid password!");
        return;
    }

    document.getElementById("tokenBox").hidden = false;
    document.getElementById("tokenOutput").value = data.token;
});

document.getElementById("btnCopy").addEventListener("click", () => {
    const text = document.getElementById("tokenOutput").value;
    navigator.clipboard.writeText(text);
    alert("Token copied!");
});
