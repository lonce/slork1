setlocal enabledelayedexpansion
FOR %%A IN (1) DO  (
	echo "Hello" %%A

	ping -n 2 127.0.0.1 >nul
	START "Chrome" chrome 
	ping -n 2 127.0.0.1 >nul
	START "Chrome" chrome "http://animatedsound.com:9050/gallery.html"

)
echo "Hello from Diffusion gallery.bat"

