async function testFetch() {
  try {
    const res = await fetch('http://localhost:5000/api/sales');
    const data = await res.json();
    console.log("Success. Rows:", data.length);
  } catch(e) {
    console.error("Fetch error:", e.message);
  } finally {
    process.exit(0);
  }
}
testFetch();
