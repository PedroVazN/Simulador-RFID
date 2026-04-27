# Uso: na pasta do projeto, com Git instalado e autenticado no GitHub (HTTPS ou SSH).
# Execute no PowerShell: .\publicar-no-github.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

git config user.name "PedroVazN"
git config user.email "vaznascimento23@gmail.com"

if (-not (Test-Path ".git")) {
  git init
}
git branch -M main
git add -A
git status
git commit -m "Simulador RFID + RH + MES (FastAPI), interface de testes"
git remote remove origin 2>$null
git remote add origin "https://github.com/PedroVazN/Simulador-RFID.git"
git push -u origin main
