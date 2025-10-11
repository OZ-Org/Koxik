import { defineConfig } from "tsup";

export default defineConfig({
	outDir: "./dist",
	clean: true,
	format: ["esm"],
	keepNames: true,
	target: "es2022",
	splitting: true,
	entry: ["./src"],
	bundle: false,
	loader: {
		".json": "json",
	},
});
