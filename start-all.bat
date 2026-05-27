@echo off
title Freereterria - Sistema de Inventario ^& POS
echo ====================================================================
echo             INICIANDO COMPONENTES DE FREERETERRIA...
echo ====================================================================
echo.

echo 1. Iniciando servidor API Backend en puerto 5000...
start cmd /k "cd backend && npm run dev"

echo 2. Iniciando servidor Frontend Vite en puerto 5173...
start cmd /k "cd frontend && npm run dev"

echo.
echo ====================================================================
echo   El sistema de ferreteria esta corriendo localmente:
echo   - Frontend: http://localhost:5173 (React + Vite + Tailwind CSS)
echo   - Backend: http://localhost:5000 (Node.js + Express + Prisma)
echo ====================================================================
pause
