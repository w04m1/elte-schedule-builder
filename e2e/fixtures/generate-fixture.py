#!/usr/bin/env python3
"""Regenerate e2e/fixtures/registered-subjects.xlsx.

The fixture mirrors the shape of the "Registered subjects" spreadsheet
exported from Neptun (Name / Status / Code / ... columns) using inline
strings, so no spreadsheet library is needed to rebuild it.

Usage: python3 e2e/fixtures/generate-fixture.py
"""

import pathlib
import zipfile

ROWS = [
    (
        "Name",
        "Status",
        "Code",
        "Credit",
        "No. of times registered for",
        "Requirement",
    ),
    (
        "Introduction to Web Development",
        "On waiting list",
        "DEMO-1",
        "4",
        "1",
        "term mark",
    ),
]


def cell(ref, value):
    return f'<c r="{ref}" t="inlineStr"><is><t>{value}</t></is></c>'


def main():
    sheet_data = "<sheetData>" + "".join(
        f'<row r="{row_index + 1}">'
        + "".join(
            cell(f"{chr(65 + column_index)}{row_index + 1}", value)
            for column_index, value in enumerate(row)
        )
        + "</row>"
        for row_index, row in enumerate(ROWS)
    ) + "</sheetData>"

    output = pathlib.Path(__file__).with_name("registered-subjects.xlsx")
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(
            "[Content_Types].xml",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>""",
        )
        archive.writestr(
            "_rels/.rels",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>""",
        )
        archive.writestr(
            "xl/workbook.xml",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Registered subjects" sheetId="1" r:id="rId1"/></sheets>
</workbook>""",
        )
        archive.writestr(
            "xl/_rels/workbook.xml.rels",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>""",
        )
        archive.writestr(
            "xl/worksheets/sheet1.xml",
            f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">{sheet_data}</worksheet>""",
        )
    print(f"wrote {output}")


if __name__ == "__main__":
    main()
