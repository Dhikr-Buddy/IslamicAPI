# Dataset Pipeline

Learn how the IslamicAPI reproducible crawling, validation, and normalization pipeline functions autonomously.

---

## The Synchronization Steps

All datasets are built sequentially through a series of discrete, single-responsibility scripts.

```
[Discover Sources] -> [Fetch Datasets] -> [Validate Data] -> [Normalize] -> [Build API Index] -> [Test]
```

### 1. Discover Sources (`pnpm discover:sources`)
Queries public indexes, Github, and registries to construct `data/metadata/source-registry.json` dynamically. It rejects any source that lacks clear public licensing or explicit redistribution permissions.

### 2. Fetch Datasets (`pnpm fetch:datasets`)
Downloads all accepted public datasets, raw files, and WOFF2 fonts into `data/<domain>/raw/<timestamp>/` and attaches individual `.metadata.json` receipts detailing the fetch provenance (URLs, file size, license).

### 3. Validate Data (`pnpm validate:data`)
Analyzes raw file structures, checking byte sizes, JSON properties, and file formats before allowing them to reach the normalization queue.

### 4. Normalization (`pnpm normalize:*`)
Applies structural conversions, transforming varying schemas (Fawaz Ahmed, Tanzil, EveryAyah, MP3Quran) into the unified, streamlined schemas utilized by the SDK.
*   `pnpm normalize:quran`
*   `pnpm normalize:hadith`
*   `pnpm normalize:audio`
*   `pnpm normalize:fonts`

### 5. Build API Index (`pnpm build:api-index`)
Compiles counts, file locations, and public Raw CDN URLs into the master manifest file `data/api/index.json`.

---

## Complete Pipeline Actions

### 1. Fully Autonomous Update Sync
To run the full discovery-to-publish sync:
```sh
pnpm sync:updates
```

### 2. Standard Local Dataset Generation
To re-compile and generate the local databases safely from stored/fetched records without hitting Github search rate-limits:
```sh
pnpm generate:data
```

### 3. Push data-only to GitLab
To easily publish the data directory to the GitLab data mirror:
```sh
pnpm push:gitlab
```
