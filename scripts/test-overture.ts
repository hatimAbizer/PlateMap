import duckdb from "@duckdb/node-api";

async function main() {
  console.log("[1] Creating DuckDB connection...");
  const conn = await duckdb.DuckDBConnection.create();

  console.log("[2] Installing extensions...");
  await conn.run(
    [
      "INSTALL httpfs",
      "LOAD httpfs",
      "SET s3_region='us-west-2'",
      "SET http_timeout=180000",
      "SET http_retries=3",
    ].join("; ") + ";"
  );

  console.log("[3] Querying single Overture file (count only)...");
  const t0 = Date.now();
  const sql = `
    SELECT COUNT(*) AS n
    FROM read_parquet('s3://overturemaps-us-west-2/release/2026-04-15.0/theme=places/type=place/part-00000-055f4006-e6da-546f-b0ef-d3b15d7c4094-c000.zstd.parquet')
    WHERE bbox.xmin BETWEEN 77.45 AND 77.75
      AND bbox.ymin BETWEEN 12.85 AND 13.08
  `;
  const reader = await conn.runAndReadAll(sql);
  const rows = reader.getRowObjectsJson();
  console.log(`[4] Done in ${Date.now() - t0}ms:`, rows);
  conn.closeSync();
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
