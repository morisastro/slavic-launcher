# Windows SmartScreen / "Wirus" — rozwiązanie

To NIE jest wirus. Windows SmartScreen blokuje wszystkie .exe **bez podpisu cyfrowego**.
Każda nowa aplikacja od nieznanego wydawcy to dostaje.

---

## Dla użytkowników launchera (darmowe, 10 sekund)

### Obejście SmartScreen:
1. Pobierz `.exe`
2. Windows pokaże "Windows protected your PC"
3. Kliknij **"More info"** (Więcej informacji)
4. Kliknij **"Run anyway"** (Uruchom mimo to)
5. Gotowe — przy kolejnych uruchomieniach nie pyta

### Windows Defender flaguje jako wirus?
- Dodaj plik do wyjątków: Settings → Update & Security → Windows Security → Virus & threat protection → Manage settings → Exclusions → Add → plik `.exe`

---

## Dla Ciebie (darmowe budowanie reputacji)

### 1. Submit do Microsoft (darmowe, ~24h)
SmartScreen buduje reputację na podstawie pobrań. Prześlij plik:
1. Wejdź https://www.microsoft.com/en-us/wdsi/filesubmission
2. Zaloguj się kontem Microsoft
3. Wybierz "Developer" → "Submit a file"
4. Wgraj plik `SlavicLauncher-Setup-x.x.x.exe`
5. Wypełnij: "This is a new Electron desktop app for Minecraft launcher, signed by me (open source)"
6. Microsoft zbada plik (~24h) i SmartScreen przestanie warnować

### 2. Submit do VirusTotal (darmowe)
1. Wejdź https://www.virustotal.com
2. Wgraj plik `.exe`
3. AV firmy dostaną sample i przestaną flagować

### 3. Buduj portable (.exe bez instalatora)
Portable build jest mniej "podejrzany" dla SmartScreen:
```bash
npm run dist:portable
```
Wygeneruje `SlavicLauncher-Portable-x.x.x.exe` — pojedynczy plik, bez instalatora.

---

## Tani certyfikat (jeśli chcesz całkowicie zlikwidować warning)

| CA | Cena | Uwagi |
|---|---|---|
| **Certum** (polska!) | ~100-200 zł/rok | Open Source code signing. Najtańsze w Polsce. https://certum.pl |
| **SSL.com** | ~$80/rok | OV (Organization Validation) |
| **Sectigo** | ~$150/rok | OV |

### Jak użyć certyfikatu:
1. Kup certyfikat (.pfx lub .pem + .key)
2. W `package.json` dodaj:
```json
"win": {
  "certificateFile": "build/cert.pfx",
  "certificatePassword": "hasło"
}
```
3. `npm run dist:win` — plik będzie podpisany, SmartScreen nie pokaże warningu

---

## Dlaczego Windows to robi?

- SmartScreen sprawdza czy .exe ma **cyfrowy podpis** od zaufanego CA
- Bez podpisu = "nieznany wydawca" = warning
- To zabezpieczenie przed malwarem
- **Nie oznacza że to wirus** — to tylko "nie rozpoznajemy tego wydawcy"

Każda duża aplikacja (Discord, Spotify) ma certyfikat. Dla małych/open source projektów to koszt, dlatego Microsoft pozwala obejść warning ("Run anyway").

---

## Najlepsza strategia (0 zł):
1. Build portable: `npm run dist:portable`
2. Submit do Microsoft (raz, darmowe)
3. Submit do VirusTotal (raz, darmowe)
4. Poinstruuj użytkowników o "More info → Run anyway"
5. Gdy projekt urośnie → kup certyfikat Certum (~150 zł/rok)