const cheerio = require("cheerio");
const axios = require("axios");
const readlineSync = require('readline-sync');
const fs = require("fs");

let inputQuery = readlineSync.question("May you Insert a name of a movie? ");

//Making a get request to the search results page
axios.get(`https://www.imdb.com/find?q=${inputQuery}&s=tt&ttype=ft`).then( urlResponse => {

     const $ = cheerio.load(urlResponse.data);

     //Looping through each of the search results
     $('td[class="result_text"]').each( (i, element) => {
        //Getting the link for the specific search result
        const movieLink = $(element).find('a').attr("href");
        const movieUrl = "https://www.imdb.com" + movieLink;
        
        //Making a get request to the specific movie page
        axios.get(movieUrl).then( movie => {

            const $$ = cheerio.load(movie.data);
            
            //all_a contains all a tags on the page 
            const all_a = $$('div[class="subtext"]').find('a').text();
            const title = $$('div[class="title_wrapper"]').find('h1').text().split("(")[0].trim();

            //Write to file only if the movie page isn't in develpment, and
            // the movie title contains the input query without spaces
            if (!all_a.includes("in-development") && title.toLowerCase().includes(inputQuery.toLowerCase())) {

                //Getting all the movie features relevant
                const duration = $$('div[class="subtext"]').find('time').text().trim();
                const ratingElm = $$('div[class="subtext"]').contents().first();
                const rating = ratingElm ? ratingElm.text().trim() : '';
                const director = $$('div[class="credit_summary_item"]').first().text().split(":")[1].trim();
                const stars = $$('div[class="credit_summary_item"]').last().text().split(":")[1].split("|")[0].trim();
                const genres = $$('div[class="subtext"]').children('a').filter((i, element) => {
                    return element.attribs['href'].includes('/search/title?genres');
                }).map((i, elm) => cheerio(elm).text()).toArray();

                //This string will be written to the file
                const movieStr = `${title} | ${genres.join(', ')} | ${rating} | ${duration} | ${director} | ${stars} \n`;

                //Those should be commented out later
                console.log("-----------------");
                console.log(movieStr);

                fs.appendFile("output.txt", movieStr, function(err) {
                    if(err) {
                        return console.log(err);
                    }
                }); 
            }
        });
    });
        
});