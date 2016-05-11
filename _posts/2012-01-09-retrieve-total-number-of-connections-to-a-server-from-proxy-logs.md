---
layout: post
title: Total number of connections to a server from proxy logs
date: '2012-01-09T07:13:00.001-05:00'
author: hiddenillusion
tags: [scripting, log analysis, bash, awk, sed, proxy, perl, grep]
modified_time: '2012-02-08T07:59:13.847-05:00'
blogger_id: tag:blogger.com,1999:blog-7113964657426756490.post-6977426686519285703
blogger_orig_url: http://hiddenillusion.blogspot.com/2012/01/retrieve-total-number-of-connections-to.html
---

# Goal

Go through every log file for a day, print the server/IP that clients were communicating with and give a total sum for the number of times each server/IP was communicated with.

## Notes

Each day has anyway from 30+ log files created from multiple sensors which archive the logs in a centralized location and the naming convention for the logs starts with %Y-%d-%m for each log. I also wanted a timer to see how long it took to process each log as well as use a for-loop which would be supplied by a # of days to recurse back to.

## Problems

1. A given server/IP could be in multiple files for the same day so I couldn't do a uniq sort on each file during my initial loop or I wouldn't get the exact number of hits for that server/IP but rather a sample. e.g.:

`awk '{print $11}' | <b>sort -u</b> | perl -ne  'chomp; if (/.*\..*?$/){print "$_\n";}'`

The above line just tells awk to print the 11th field (server/IP in this case), sorts the results to unique then gets rid of anything that doesn't look like it's a website/IP.

Here is an example of the data set I was working with:

```
thatdude@lol:~> cat sample.txt | grep "0.0.0.0$" | less > 0.0.0.0.txt
  1 0.0.0.0
  1 0.0.0.0
  1 0.0.0.0
  1 0.0.0.0
  1 0.0.0.0
  1 0.0.0.0
  1 0.0.0.0
  11 0.0.0.0
  12 0.0.0.0
  15 0.0.0.0
  2 0.0.0.0
  2 0.0.0.0
  2 0.0.0.0
  2 0.0.0.0
  2 0.0.0.0
  28 0.0.0.0
  29 0.0.0.0
  33 0.0.0.0
  37 0.0.0.0
  4 0.0.0.0
  4 0.0.0.0
  4 0.0.0.0
  5 0.0.0.0
  5 0.0.0.0
  5 0.0.0.0
  6 0.0.0.0
  9 0.0.0.0
  9 0.0.0.0
thatdude@lol:~> cat 0.0.0.0.txt | awk '{ sum+=$1 } END {print sum}'
  233
```

So now you can see that the IP '0.0.0.0' was contained within multiple log files for the same day so now that I had a count for how many times that server/IP was listed within each log file I needed to combine all matching server/IP values together.  I was given advice to put it into an array in perl but realized I could also leverage awk to do the same thing. e.g.:

`awk '{array[$2]+=$1} END { for (i in array) {print array[i], i}}'`

It's a beautiful thing when it works.... the above awk line creates an array on the 2nd column (server/IP) and as it goes through its for-loop will sum up the the values in the first column when additional, similar values in the 2nd column are found.  To put it all into perspective, the script below met the following decision flow:

1. List the directory where the logs are located and find all of the logs for a given day
2. Use a for-loop to tell it how many days to recurse back to
3. Calculate how long it takes do process each days logs
4. Once all of the logs are found for a given day, search through each one and print the field containing the server/IP, sort the results, get rid of anything that doesn't look like it's a website or IP address then print a unique count for each server/IP found within a given days logs
5. Open up the results from a given day and concatenate the results so a unique server/IP would have the total amount of hits while only being displayed once
6. To save space, compress the results

... and the script:

```bash
#!/bin/bash
Log_Path="/path/to/logs"
CurrentDate=`date +%Y-%d-%m`
CompressedDate=`date --date="-$n day" +%d-%m-%Y`
Daily_Stats_Path="/path/to/export"

for ((n=0; n<=50; n++)); do
tic=$(date +%s)
Yesterday=(`date --date="-$n day" +%Y-%d-%m`)
CompressedDate=(`date --date="-$n day" +%m-%d-%Y`)
ls $Log_Path | grep $Yesterday |while read files; do
        zcat $Log_Path/$files | awk '{print $11}' | sort | perl -ne 'chomp; if (/.*\..*?$/){print "$_\n";}' | uniq -c >> $Daily_Stats_Path/$Yesterday.tmp
        done
wait
awk '{array[$2]+=$1} END { for (i in array) {print array[i], i}}' $Daily_Stats_Path/$Yesterday.tmp | sort -nr  >> $Daily_Stats_Path/$CompressedDate.txt
rm $Daily_Stats_Path/$Yesterday.tmp
gzip -9 $Daily_Stats_Path/$CompressedDate.txt
toc=$(date +%s)
total=$(expr $toc - $tic)
min=$(expr $total / 60)
sec=$(expr $total % 60)
echo "$CompressedDate.txt took :" $min"m":$sec"s"
done
```