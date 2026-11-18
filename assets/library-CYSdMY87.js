var e=`---
title: Library
summary: A reading list for IT service management, IT studies, and programming, with library access links and notes on writing forms.
category: Reference
order: 100
---

# Library

This article lists books for IT service management (ITSM), IT studies, and programming. It also lists library access links and the common forms of English writing.

## IT studies

| Title | Edition or reference |
| --- | --- |
| Foundations of IT Service Management with ITIL 2011: ITIL Foundations Course in a Book | ITIL 2011 |
| IT Service Management Support for your ITSM Foundation exam | Revised 3rd edition |
| Computer Networks and Internets | 6th edition |
| Ethics in Information Technology | 6th edition |
| Database Systems: Design, Implementation, and Management | 13th edition |
| Building Cross-Platform Mobile and Web Apps for Engineers and Scientists: An Active Learning Approach | 1st edition, with the Lingras code files |

## IT service management

| Title | Reference | Link |
| --- | --- | --- |
| Information Technology Project Management, Kathy Schwalbe | Edition 9, ISBN 9781337101356 | |
| Practical IT Service Management: A Concise Guide for Busy Executives | ISBN 9781849281546 | |
| ITIL 4 Essentials: Your essential guide for the ITIL 4 Foundation exam and beyond | 2nd edition | |
| Reinventing ITIL in the Age of DevOps: Innovative Techniques to Make Processes Agile and Relevant | ISBN 9781484239766 | |
| Incident Management for IT Departments | O'Toole, D. (2015) | [Library record](https://go.exlibris.link/15SgnGfp) |
| Problem Management: An Implementation Guide for the Real World | Hall, M. G. (2014). BCS Learning and Development Limited, The Chartered Institute for IT | |
| A Guide to Service Desk Concepts | Knapp, D. 4th edition. Cengage Learning | [Library record](https://go.exlibris.link/pP9hF72N) |
| ITIL Service Operation | Steinberg, R. (2011). Stationery Office Limited | |
| ITIL Service Operation | Steinberg, R. (2019). Stationery Office Limited | |
| Servicing ITSM: A Handbook of Service Descriptions for IT Service Managers | Steinberg, R. (2013). Trafford Publishing | [Library record](https://go.exlibris.link/VLFVmhJv) |
| Implementing IT Service Management: A systematic literature review | Iden, J., and Eikebrokk, T. R. (2013). International Journal of Information Management | |
| ITIL Foundation: ITIL 4th Edition | Steinberg, R. A. (2019). London: Axelos Limited. Stationery Office | |
| Research Methodology: A Step-by-Step Guide | ISBN-13 9781526449900 | |

## Programming library

| Name | Link | Notes |
| --- | --- | --- |
| Microsoft Dynamics 365 Business Central API v2.0 Reference | [Amazon](https://a.co/d/hJm4aQs) | Book |
| EbookFoundation free programming books | [GitHub](https://github.com/EbookFoundation/free-programming-books) | Free and legal books |
| O'Reilly library access | [O'Reilly](https://www.oreilly.com/library-access/) | Access through an employer or a library |
| UNISA library | [Oasis](http://oasis.unisa.ac.za/) | Student library access |
| Anna's Archive | [annas-archive.org](https://annas-archive.org) | Search engine for shadow libraries |
| Library Genesis | [library.lol](https://library.lol/) | |
| Z-Library | [z-lib.gs](https://z-lib.gs/), [zlib.pub](https://zlib.pub) | |
| HiddenWiki | [hiddenwiki.pro](https://hiddenwiki.pro/) | Directory of .onion sites |
| Just Another Library | \`libraryfyuybp7oyidyya3ah5xvwgyx6weauoini7zyz555litmmumad.onion\` | Opens only in Tor Browser |

## Library archives

Store a small file as a Base64 string to keep it in a text note. Run these commands in Windows PowerShell 5.1.

\`\`\`powershell
# Convert a file to Base64
[convert]::ToBase64String((Get-Content -Path "your_file_path" -Encoding Byte))

# Convert text to Base64 (UTF-16)
[convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes("Hello world"))
\`\`\`

> **NOTE:** In PowerShell 7, \`-Encoding Byte\` does not exist. Use \`-AsByteStream\` instead.

Archive entries:

- Microsoft Dynamics AX 2012 Development Cookbook, M. Pocius (Packt, 2012): \`[base64string]\`
- Learning Microsoft Dynamics AX 2012 Programming: \`[base64string]\`

## Types of English writing

Each form has its own style and conventions for its audience and purpose.

| Form | Examples |
| --- | --- |
| Business writing | Reports, emails, memos, proposals, and other professional correspondence |
| Academic writing | Research papers and essays |
| Creative writing | Fiction and poetry |
| Technical writing | Manuals, user guides, and other text that explains technical or scientific information |
| Journalistic writing | News articles and feature stories |
| Legal writing | Contracts and briefs |
| Medical writing | Medical reports and research papers in healthcare |

## Related links

- [Development nexuses](doc:development-nexuses)
- [Notepad](doc:notepad)
`;export{e as default};