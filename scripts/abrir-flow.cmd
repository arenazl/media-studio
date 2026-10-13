@echo off
rem Abre Flow en el Chrome con la sesion de Lucas y la extension Puente Flow (2026-10-13). El backend hace lo mismo solo
rem cuando un trabajo lo necesita (server/abrirFlow.mjs); esto es para abrirlo a mano con doble click.
start "" "C:Program FilesGoogleChromeApplicationchrome.exe" --profile-directory=Default https://flow.google.com/
