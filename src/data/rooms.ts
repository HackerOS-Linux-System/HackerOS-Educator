import type { ProgrammingLanguage, Room, TrackId } from "../types";

// --- Cyberbezpieczeństwo ---
import introToCybersecurity from "./rooms/intro-to-cybersecurity.json";
import computerFundamentalsInsideAComputer from "./rooms/computer-fundamentals-inside-a-computer.json";
import howTheWebWorks from "./rooms/how-the-web-works.json";
import operatingSystemsFundamentals from "./rooms/operating-systems-fundamentals.json";
import linuxFundamentals from "./rooms/linux-fundamentals.json";
import networkBasics from "./rooms/network-basics.json";
import webSecurityFundamentals from "./rooms/web-security-fundamentals.json";
import cryptographyBasics from "./rooms/cryptography-basics.json";
import passwordSecurity from "./rooms/password-security.json";
import osintFundamentals from "./rooms/osint-fundamentals.json";
import socialEngineeringAwareness from "./rooms/social-engineering-awareness.json";
import digitalForensicsBasics from "./rooms/digital-forensics-basics.json";
import wirelessSecurityBasics from "./rooms/wireless-security-basics.json";
import linuxPrivilegeEscalationConcepts from "./rooms/linux-privilege-escalation-concepts.json";
import incidentResponseBasics from "./rooms/incident-response-basics.json";
import networkScanningNmap from "./rooms/network-scanning-nmap.json";
import networkTrafficAnalysis from "./rooms/network-traffic-analysis.json";
import activeDirectoryBasics from "./rooms/active-directory-basics.json";
import cloudSecurityBasics from "./rooms/cloud-security-basics.json";
import containerSecurity from "./rooms/container-security.json";
import secureCodingPractices from "./rooms/secure-coding-practices.json";
import privacyComplianceBasics from "./rooms/privacy-compliance-basics.json";
import capstoneBlueTeamInvestigation from "./rooms/capstone-blue-team-investigation.json";
import apiSecurityBasics from "./rooms/api-security-basics.json";
import mobileSecurityBasics from "./rooms/mobile-security-basics.json";
import iotSecurityBasics from "./rooms/iot-security-basics.json";
import threatModelingBasics from "./rooms/threat-modeling-basics.json";
import zeroTrustArchitecture from "./rooms/zero-trust-architecture.json";
import malwareAnalysisConcepts from "./rooms/malware-analysis-concepts.json";
import capstoneWebappPentestReport from "./rooms/capstone-webapp-pentest-report.json";
import vulnerabilityManagementBasics from "./rooms/vulnerability-management-basics.json";

// --- Administracja Linuksem ---
import linuxAdminIntro from "./rooms/linux-admin-intro.json";
import linuxUsersPermissions from "./rooms/linux-users-permissions.json";
import linuxSystemdServices from "./rooms/linux-systemd-services.json";
import linuxNetworkingAdmin from "./rooms/linux-networking-admin.json";
import linuxPackageManagement from "./rooms/linux-package-management.json";
import linuxCronAutomation from "./rooms/linux-cron-automation.json";
import linuxLogsMonitoring from "./rooms/linux-logs-monitoring.json";
import linuxShellScriptingAdmin from "./rooms/linux-shell-scripting-admin.json";
import linuxDisksStorage from "./rooms/linux-disks-storage.json";
import linuxBackupStrategies from "./rooms/linux-backup-strategies.json";
import linuxContainersDocker from "./rooms/linux-containers-docker.json";
import linuxSelinuxApparmor from "./rooms/linux-selinux-apparmor.json";
import linuxBootProcess from "./rooms/linux-boot-process.json";
import linuxHighAvailability from "./rooms/linux-high-availability.json";
import linuxVirtualizationKvm from "./rooms/linux-virtualization-kvm.json";
import linuxConfigManagementAnsible from "./rooms/linux-config-management-ansible.json";
import linuxMonitoringStack from "./rooms/linux-monitoring-stack.json";
import linuxVpnNetworking from "./rooms/linux-vpn-networking.json";
import linuxKernelTuning from "./rooms/linux-kernel-tuning.json";
import linuxAdminCapstone from "./rooms/linux-admin-capstone.json";
import linuxTroubleshootingMethodology from "./rooms/linux-troubleshooting-methodology.json";

// --- Programowanie: języki ogólnego przeznaczenia ---
import programmingHtmlBasics from "./rooms/programming-html-basics.json";
import programmingHtmlIntermediate from "./rooms/programming-html-intermediate.json";
import programmingCssBasics from "./rooms/programming-css-basics.json";
import programmingCssIntermediate from "./rooms/programming-css-intermediate.json";
import programmingJavascriptBasics from "./rooms/programming-javascript-basics.json";
import programmingJavascriptIntermediate from "./rooms/programming-javascript-intermediate.json";
import programmingTypescriptBasics from "./rooms/programming-typescript-basics.json";
import programmingTypescriptIntermediate from "./rooms/programming-typescript-intermediate.json";
import programmingPythonBasics from "./rooms/programming-python-basics.json";
import programmingPythonIntermediate from "./rooms/programming-python-intermediate.json";
import programmingSqlBasics from "./rooms/programming-sql-basics.json";
import programmingGitBasics from "./rooms/programming-git-basics.json";
import programmingGitIntermediate from "./rooms/programming-git-intermediate.json";
import programmingRegexBasics from "./rooms/programming-regex-basics.json";
import programmingRustBasics from "./rooms/programming-rust-basics.json";
import programmingRustIntermediate from "./rooms/programming-rust-intermediate.json";
import programmingLuaBasics from "./rooms/programming-lua-basics.json";
import programmingLuaIntermediate from "./rooms/programming-lua-intermediate.json";
import programmingShellBasics from "./rooms/programming-shell-basics.json";
import programmingShellIntermediate from "./rooms/programming-shell-intermediate.json";
import programmingGoBasics from "./rooms/programming-go-basics.json";
import programmingGoIntermediate from "./rooms/programming-go-intermediate.json";

// --- Programowanie: rodzime języki HackerOS ---
import programmingHackerlangBasics from "./rooms/programming-hackerlang-basics.json";
import programmingHackerlangIntermediate from "./rooms/programming-hackerlang-intermediate.json";
import programmingHackerlangAdvanced from "./rooms/programming-hackerlang-advanced.json";
import programmingHsharpBasics from "./rooms/programming-hsharp-basics.json";
import programmingHsharpIntermediate from "./rooms/programming-hsharp-intermediate.json";
import programmingHsharpAdvanced from "./rooms/programming-hsharp-advanced.json";
import programmingHackerscriptBasics from "./rooms/programming-hackerscript-basics.json";
import programmingHackerscriptIntermediate from "./rooms/programming-hackerscript-intermediate.json";
import programmingHackerscriptAdvanced from "./rooms/programming-hackerscript-advanced.json";

// --- Programowanie: kapsztaty ---
import capstoneHackerosCliTool from "./rooms/capstone-hackeros-cli-tool.json";

// Dodając nowy plik JSON w src/data/rooms/, wystarczy zaimportować go
// tutaj i dopisać do tablicy poniżej — cała reszta UI wczyta go automatycznie.
// Pamiętaj o polu "track" (i "language" dla trybu programming) w src/types.ts.
// Pokoje społecznościowe (paczki) nie trafiają tutaj — są wczytywane
// dynamicznie z profilu użytkownika, patrz getAllRooms().
export const builtInRooms: Room[] = [
  // Cyberbezpieczeństwo
  introToCybersecurity as Room,
  computerFundamentalsInsideAComputer as Room,
  howTheWebWorks as Room,
  operatingSystemsFundamentals as Room,
  linuxFundamentals as Room,
  networkBasics as Room,
  webSecurityFundamentals as Room,
  cryptographyBasics as Room,
  passwordSecurity as Room,
  osintFundamentals as Room,
  socialEngineeringAwareness as Room,
  digitalForensicsBasics as Room,
  wirelessSecurityBasics as Room,
  linuxPrivilegeEscalationConcepts as Room,
  incidentResponseBasics as Room,
  networkScanningNmap as Room,
  networkTrafficAnalysis as Room,
  activeDirectoryBasics as Room,
  cloudSecurityBasics as Room,
  containerSecurity as Room,
  secureCodingPractices as Room,
  privacyComplianceBasics as Room,
  capstoneBlueTeamInvestigation as Room,
  apiSecurityBasics as Room,
  mobileSecurityBasics as Room,
  iotSecurityBasics as Room,
  threatModelingBasics as Room,
  zeroTrustArchitecture as Room,
  malwareAnalysisConcepts as Room,
  capstoneWebappPentestReport as Room,
  vulnerabilityManagementBasics as Room,

  // Administracja Linuksem
  linuxAdminIntro as Room,
  linuxUsersPermissions as Room,
  linuxSystemdServices as Room,
  linuxNetworkingAdmin as Room,
  linuxPackageManagement as Room,
  linuxCronAutomation as Room,
  linuxLogsMonitoring as Room,
  linuxShellScriptingAdmin as Room,
  linuxDisksStorage as Room,
  linuxBackupStrategies as Room,
  linuxContainersDocker as Room,
  linuxSelinuxApparmor as Room,
  linuxBootProcess as Room,
  linuxHighAvailability as Room,
  linuxVirtualizationKvm as Room,
  linuxConfigManagementAnsible as Room,
  linuxMonitoringStack as Room,
  linuxVpnNetworking as Room,
  linuxKernelTuning as Room,
  linuxAdminCapstone as Room,
  linuxTroubleshootingMethodology as Room,

  // Programowanie — języki ogólnego przeznaczenia
  programmingHtmlBasics as Room,
  programmingHtmlIntermediate as Room,
  programmingCssBasics as Room,
  programmingCssIntermediate as Room,
  programmingJavascriptBasics as Room,
  programmingJavascriptIntermediate as Room,
  programmingTypescriptBasics as Room,
  programmingTypescriptIntermediate as Room,
  programmingPythonBasics as Room,
  programmingPythonIntermediate as Room,
  programmingSqlBasics as Room,
  programmingGitBasics as Room,
  programmingGitIntermediate as Room,
  programmingRegexBasics as Room,
  programmingRustBasics as Room,
  programmingRustIntermediate as Room,
  programmingLuaBasics as Room,
  programmingLuaIntermediate as Room,
  programmingShellBasics as Room,
  programmingShellIntermediate as Room,
  programmingGoBasics as Room,
  programmingGoIntermediate as Room,

  // Programowanie — rodzime języki HackerOS
  programmingHackerlangBasics as Room,
  programmingHackerlangIntermediate as Room,
  programmingHackerlangAdvanced as Room,
  programmingHsharpBasics as Room,
  programmingHsharpIntermediate as Room,
  programmingHsharpAdvanced as Room,
  programmingHackerscriptBasics as Room,
  programmingHackerscriptIntermediate as Room,
  programmingHackerscriptAdvanced as Room,

  // Programowanie — kapsztaty
  capstoneHackerosCliTool as Room,
];

/** Zwraca wbudowane pokoje połączone z pokojami zaimportowanymi przez użytkownika. */
export function getAllRooms(customRooms: Room[]): Room[] {
  const customIds = new Set(customRooms.map((r) => r.id));
  // Niestandardowy pokój o id kolidującym z wbudowanym nadpisuje wbudowany —
  // przydatne przy tworzeniu własnej, zmodyfikowanej wersji istniejącego pokoju.
  const base = builtInRooms.filter((r) => !customIds.has(r.id));
  return [...base, ...customRooms];
}

export function getRoomById(rooms: Room[], id: string): Room | undefined {
  return rooms.find((r) => r.id === id);
}

export function isRoomUnlocked(room: Room, completedRoomIds: Set<string>): boolean {
  return room.prerequisites.every((id) => completedRoomIds.has(id));
}

/** Filtruje pokoje do bieżącego trybu nauki (Hacking / Linux / Programowanie). */
export function roomsForTrack(rooms: Room[], track: TrackId): Room[] {
  return rooms.filter((r) => r.track === track);
}

export function languagesInRooms(rooms: Room[]): ProgrammingLanguage[] {
  const langs = new Set<ProgrammingLanguage>();
  for (const r of rooms) {
    if (r.language) langs.add(r.language);
  }
  return Array.from(langs);
}

export const CATEGORIES = (rooms: Room[]): string[] =>
  Array.from(new Set(rooms.map((r) => r.category))).sort();
