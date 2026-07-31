import os
import uuid
import base64
import shutil
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

class CompileRequest(BaseModel):
	code: str

@app.post("/compile")
async def compile_code(request: CompileRequest):
	if not request.code:
		raise HTTPException(status_code=400, detail="No code provided")

	job_id = str(uuid.uuid4())
	work_dir = f"/tmp/{job_id}"
	os.makedirs(work_dir, exist_ok=True)

	source_path = os.path.join(work_dir, "main.cpp")
	js_path = os.path.join(work_dir, "main.js")
	wasm_path = os.path.join(work_dir, "main.wasm")

	try:
		with open(source_path, "w") as f:
			f.write(request.code)

		emcc_cmd = [
			"emcc", source_path,
			"-O3",
			"-I/app/include",
			"-s", "WASM=1",
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