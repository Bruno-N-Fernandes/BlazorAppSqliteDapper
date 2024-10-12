export function synchronizeMemoryFileSystemWithIndexedDb(filename, version = 1) {
	const fileSystem = "MemoryFileSystem";
	const file = filename.split(/[\\\/]/).pop();
	const path = filename.substring(0, filename.lastIndexOf('/') + 1);

	return new Promise((res, rej) => {
		const dbRequest = window.indexedDB.open(fileSystem, version);

		dbRequest.onupgradeneeded = () => {
			dbRequest.result.createObjectStore(path, { keypath: 'id' });
		};

		dbRequest.onsuccess = () => {
			const req = dbRequest.result.transaction(path, 'readonly').objectStore(path).get(file);

			req.onsuccess = () => {
				FS.createPath(".", path, true, true);
				FS.createDataFile(".", filename, req.result, true, true, true);
				res();
			};
		};

		let lastModifiedTime = new Date();

		setInterval(() => {
			if (FS.analyzePath(filename).exists) {
				const stats = FS.stat(filename);
				if (stats.mtime.valueOf() !== lastModifiedTime.valueOf()) {
					lastModifiedTime = stats.mtime;
					const data = FS.readFile(filename);

					const folder = dbRequest.result.transaction(path, 'readwrite').objectStore(path);
					folder.put(data, file);
					folder.put(stats.blocks, file + ".blocks");
					folder.put(stats.mtime, file + ".mtime");
					folder.put(stats.size, file + ".size");
					folder.put(stats.mode, file + ".mode");
					folder.put(stats.rdev, file + ".rdev");
					folder.put(stats.dev, file + ".dev");
					folder.put(stats.ino, file + ".ino");
				}
			}
		}, 1000);
	});
}

export function downloadSqliteFromMemoryFileSystem(filename) {
	const path = `/${filename}`;
	if (FS.analyzePath(path).exists) {
		const content = FS.readFile(path);
		blazorDownloadFile(filename, "application/octet-stream", content);
	}
}

export function blazorDownloadFile(filename, contentType, content) {
	// Create the URL
	const file = new File([content], filename, { type: contentType });
	const exportUrl = URL.createObjectURL(file);

	// Create the <a> element and click on it
	const a = document.createElement("a");
	document.body.appendChild(a);
	a.href = exportUrl;
	a.download = filename;
	a.target = "_self";
	a.click();

	// We don't need to keep the object URL, let's release the memory
	// On older versions of Safari, it seems you need to comment this line...
	URL.revokeObjectURL(exportUrl);
}

export function blazorDownloadFileNet50(fileName, contentType, content) {
	// Convert the parameters to actual JS types
	fileName = BINDING.conv_string(fileName) ?? fileName;
	contentType = BINDING.conv_string(contentType) ?? contentType;
	const contentArray = Blazor.platform.toUint8Array(content);

	// Create the URL
	const file = new File([contentArray], fileName, { type: contentType });
	const exportUrl = URL.createObjectURL(file);

	// Create the <a> element and click on it
	const a = document.createElement("a");
	document.body.appendChild(a);
	a.href = exportUrl;
	a.download = fileName;
	a.target = "_self";
	a.click();

	// We don't need to keep the url, let's release the memory
	// On Safari it seems you need to comment this line... (please let me know if you know why)
	URL.revokeObjectURL(exportUrl);
}

export function blazorDownloadFileNet31(filename, contentType, content) {
	// Blazor marshall byte[] to a base64 string, so we first need to convert
	// the string (content) to a Uint8Array to create the File
	const data = base64DecToArr(content);

	// Create the URL
	const file = new File([data], filename, { type: contentType });
	const exportUrl = URL.createObjectURL(file);

	// Create the <a> element and click on it
	const a = document.createElement("a");
	document.body.appendChild(a);
	a.href = exportUrl;
	a.download = filename;
	a.target = "_self";
	a.click();

	// We don't need to keep the object URL, let's release the memory
	// On older versions of Safari, it seems you need to comment this line...
	URL.revokeObjectURL(exportUrl);
}

// Convert a base64 string to a Uint8Array. This is needed to create a blob object from the base64 string.
// The code comes from: https://developer.mozilla.org/fr/docs/Web/API/WindowBase64/D%C3%A9coder_encoder_en_base64
function b64ToUint6(nChr) {
	return nChr > 64 && nChr < 91 ? nChr - 65 : nChr > 96 && nChr < 123 ? nChr - 71 : nChr > 47 && nChr < 58 ? nChr + 4 : nChr === 43 ? 62 : nChr === 47 ? 63 : 0;
}

function base64DecToArr(sBase64, nBlocksSize) {
	var
		sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""),
		nInLen = sB64Enc.length,
		nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2,
		taBytes = new Uint8Array(nOutLen);

	for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
		nMod4 = nInIdx & 3;
		nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
		if (nMod4 === 3 || nInLen - nInIdx === 1) {
			for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
				taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
			}
			nUint24 = 0;
		}
	}
	return taBytes;
}
