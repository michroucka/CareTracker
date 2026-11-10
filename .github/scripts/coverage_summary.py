"""Markdown table of test coverage for $GITHUB_STEP_SUMMARY.

Usage:
    coverage_summary.py jacoco <path to jacoco.csv>
    coverage_summary.py vitest <path to coverage-summary.json>
"""
import csv
import json
import sys
from collections import defaultdict

ROOT_PACKAGE = "cz.zcu.kiv.caretracker"


def format_percent(value):
    return f"{value:.1f} %".replace(".", ",")


def percent(covered, missed):
    total = covered + missed
    return format_percent(100 * covered / total) if total else "–"


def jacoco(path):
    lines = defaultdict(lambda: [0, 0])
    branches = defaultdict(lambda: [0, 0])
    with open(path, newline="") as report:
        for row in csv.DictReader(report):
            package = row["PACKAGE"].removeprefix(ROOT_PACKAGE).lstrip(".") or "(kořen)"
            for package_key in (package, "Celkem"):
                lines[package_key][0] += int(row["LINE_COVERED"])
                lines[package_key][1] += int(row["LINE_MISSED"])
                branches[package_key][0] += int(row["BRANCH_COVERED"])
                branches[package_key][1] += int(row["BRANCH_MISSED"])

    packages = sorted(key for key in lines if key != "Celkem") + ["Celkem"]
    print("### Pokrytí backendu (JaCoCo)\n")
    print("| Balíček | Řádky | Větve |")
    print("| --- | ---: | ---: |")
    for package in packages:
        name = f"**{package}**" if package == "Celkem" else f"`{package}`"
        print(f"| {name} | {percent(*lines[package])} | {percent(*branches[package])} |")


def vitest(path):
    with open(path) as report:
        total = json.load(report)["total"]
    print("### Pokrytí frontendu (Vitest)\n")
    print("| Řádky | Větve | Funkce |")
    print("| ---: | ---: | ---: |")
    lines, branches, functions = (format_percent(total[metric]["pct"]) for metric in ("lines", "branches", "functions"))
    print(f"| {lines} | {branches} | {functions} |")


if __name__ == "__main__":
    {"jacoco": jacoco, "vitest": vitest}[sys.argv[1]](sys.argv[2])
