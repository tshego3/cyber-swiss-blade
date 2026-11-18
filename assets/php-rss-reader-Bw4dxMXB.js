var e=`---
title: PHP RSS feed reader
summary: A single PHP page that reads items from more than one RSS feed, sorts them by date, and shows them as a list.
category: TypeScript and JavaScript
order: 40
---

# PHP RSS feed reader

This PHP page reads the items from a list of RSS feeds, sorts all items by publication date, and shows them in one list. Use it as a small server-side feed aggregator.

## Before you start

- A web server that runs PHP.
- The PHP SimpleXML extension (\`simplexml_load_file\`).
- A PHP setting that lets \`simplexml_load_file\` open remote URLs (\`allow_url_fopen\`).

## Code

\`\`\`php
<html>
    <head>
        <title>RSS Feed Reader</title>
    </head>
    <body>
        <?php
        //Feed URLs
        $feeds = array(
            "http://maxburstein.com/rss",
            "http://www.engadget.com/rss.xml",
            "http://www.reddit.com/r/programming/.rss"
        );
        
        //Read each feed's items
        $entries = array();
        foreach($feeds as $feed) {
            $xml = simplexml_load_file($feed);
            $entries = array_merge($entries, $xml->xpath("//item"));
        }
        
        //Sort feed entries by pubDate
        usort($entries, function ($feed1, $feed2) {
            return strtotime($feed2->pubDate) - strtotime($feed1->pubDate);
        });
        
        ?>
        
        <ul><?php
        //Print all the entries
        foreach($entries as $entry){
            ?>
            <li><a href="<?= $entry->link ?>"><?= $entry->title ?></a> (<?= parse_url($entry->link)['host'] ?>)
            <p><?= strftime('%m/%d/%Y %I:%M %p', strtotime($entry->pubDate)) ?></p>
            <p><?= $entry->description ?></p></li>
            <?php
        }
        ?>
        </ul>
    </body>
</html>
\`\`\`

## How to use it

1. Save the code as a \`.php\` file (for example, \`rss_reader.php\`) on your PHP web server.
2. Change the URLs in the \`$feeds\` array to the feeds that you want to read.
3. Open the page in a browser.

**Result:** The page shows one list with the newest item first. Each item shows the title as a link, the host name of the link, the date and time, and the description.

## How it works

- \`simplexml_load_file\` reads each feed. The XPath query \`//item\` gets all \`<item>\` elements, and \`array_merge\` adds them to one array.
- \`usort\` sorts the array. The callback subtracts the timestamps, so the newest item comes first.
- \`parse_url($entry->link)['host']\` gets the site name for each item.
- \`strftime('%m/%d/%Y %I:%M %p', ...)\` formats the date as month, day, year, and 12-hour time.

> **NOTE:** Dated (checked November 2026): PHP 8.1 deprecated \`strftime\`, so the page can show a deprecation warning. Use \`date('m/d/Y h:i A', strtotime($entry->pubDate))\` or \`DateTime::format\` for the same output.

> **NOTE:** Verify that the sample feed URLs still work. Some of these sites now redirect to HTTPS or block requests that have no user agent.

> **WARNING:** The page writes the feed title, link, and description into the HTML without escaping. A feed can inject HTML or script into the page. Use \`htmlspecialchars\` on values that you do not trust.

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| The page shows a warning from \`simplexml_load_file\` | The server cannot open the feed URL, or \`allow_url_fopen\` is off | Make sure that the URL is correct and that the PHP setting lets PHP open remote files. |
| The page shows a fatal error on \`$xml->xpath\` | \`simplexml_load_file\` returned \`false\` because the feed did not load | Remove the feed from the list or add a check for \`false\`. |
`;export{e as default};