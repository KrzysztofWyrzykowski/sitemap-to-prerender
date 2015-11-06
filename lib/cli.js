#!/usr/bin/env node
'use strict';
var path = require('path');
var fs = require('fs');
var meow = require('meow');
var stdin = require('get-stdin');
var updateNotifier = require('update-notifier');
var sitemapUrls = require('sitemap-urls');
var pkg = require('../package.json');
var request = require('request');

var HELP_FILE_PATH = path.join(__dirname, 'help.txt');


updateNotifier({pkg:pkg}).notify();

var cli = meow({
    pkg: pkg,
    help: fs.readFileSync(HELP_FILE_PATH, {encoding:'utf8'}).trim()
}, {
    alias: {
        help: 'h',
        version: 'v',
        prerender: 'p'
    }
});

stdin(function onStdin(sitemap) {
    var urls;
    var filepath;

    // Require stdin or file
    if (!sitemap && !cli.input[0] || !cli.flags.prerender) {
        cli.showHelp();
        process.exit(1);
    }

    // Try reading file if no stdin
    if (!sitemap) {
        filepath = path.resolve(cli.input[0]);
        if (!fs.existsSync(filepath) || !fs.statSync(filepath).isFile()) {
            console.error('File doesn\'t exist:', filepath);
            process.exit(1);
        }

        sitemap = fs.readFileSync(filepath, {encoding:'utf8'});
    }

    urls = sitemapUrls.extractUrls(sitemap);

    function doRequest(index, urls) {
        if (index == urls.length) {
            return;
        }
        var url = cli.flags.prerender + '/' + urls[index];
        console.log('GET ' + url);
        request(url, function (error, response) {
            console.log('STATUS CODE: ' + response.statusCode);
            if (error) {
                console.log(error);
            } else {
                doRequest(index + 1, urls);
            }
        });
    }

    doRequest(0, urls);
});
