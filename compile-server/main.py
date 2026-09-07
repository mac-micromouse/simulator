import os
import uuid
import base64
import shutil
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from werkzeug.utils import secure_filename

app = FastAPI()

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

class CompileFile(BaseModel):
	name: str
	code: str

class CompileRequest(BaseModel):
	files: list[CompileFile]

@app.post("/compile")
async def compile_code(request: CompileRequest):
	if not request.files:
		raise HTTPException(status_code=400, detail="No files provided")

	job_id = str(uuid.uuid4())
	work_dir = f"/tmp/{job_id}"
	os.makedirs(work_dir, exist_ok=True)

	js_path = os.path.join(work_dir, "main.js")
	wasm_path = os.path.join(work_dir, "main.wasm")

	try:
		all_paths = []

		for included_file in request.files:
			source_path = os.path.join(work_dir, secure_filename(included_file.name))
			all_paths.append(source_path)

			with open(source_path, "w") as f:
				f.write(included_file.code)

		emcc_cmd = [
			"emcc", *[f for f in all_paths if f.endswith(".cpp")], "/app/include/micromouse.cpp",
			"-O3",
			"-I/app/include",
			"-s", "WASM=1",
			"-s", "ASYNCIFY",
			"-o", js_path
		]

		process = await asyncio.create_subprocess_exec(
			*emcc_cmd,
			stdout=asyncio.subprocess.PIPE,
			stderr=asyncio.subprocess.PIPE
		)

		stdout, stderr = await process.communicate()

		if not process.returncode == 0:
			error_msg = stderr.decode() or stdout.decode()
			raise HTTPException(status_code=400, detail=error_msg)

		with open(js_path, "r") as f:
			js_glue = f.read()

		with open(wasm_path, "rb") as f:
			wasm_binary = f.read()

		return {
			"js": js_glue,
			"wasmBase64": base64.b64encode(wasm_binary).decode("utf-8")
		}

	finally:
		if os.path.exists(work_dir):
			shutil.rmtree(work_dir, ignore_errors=True)