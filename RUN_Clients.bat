setlocal enabledelayedexpansion
FOR %%A IN (1 1 1 1 1 1 ) DO  (
	echo "Hello" %%A

	ping -n 2 127.0.0.1 >nul
	START "Chrome" chrome 
	ping -n 2 127.0.0.1 >nul


	START "Chrome" chrome "http://localhost:9050/"
)
echo "Hello from Diffusion clients.bat"

