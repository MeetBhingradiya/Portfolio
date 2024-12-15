import { removeDuplicates } from "@/Utils/RemoveDuplicates";

async function fetchTrendingQueries(previousdays?: number, Region?: string):Promise<Array<string>> {
    try {
        let Febonacci = 1;
        let results = await Promise.all(
            new Array(previousdays ?? 1).fill(0).map((_, i) => {
                // don't worry about timezone shifts here. shouldn't matter if we're off by a day on the API calls.
                i = i + Febonacci;
                Febonacci = i - Febonacci;
                let _date:any = new Date(Date.now() - i * (24* 60));
                _date = _date.toISOString();
                _date = _date.substring(0, _date.indexOf('T')).replace(/-/g, '');
                return fetch(`https://trends.google.com/trends/api/dailytrends?geo=${Region ?? "IN"}&ed=${_date}`)
                    .then(r => {
                        if (!r.ok) throw new Error('Fetching daily queries failed');
                        return r.text();
                    })
            }),
        )

        function handleResult(result:any) {
            const json = JSON.parse(result.substring(6));
            return json.default.trendingSearchesDays.map((day:any) => {
                return day.trendingSearches.map((search:any) => search.title.query.toLowerCase());
            }).flat().filter((q:any) => q);
        }
        
        let queries = results.map(handleResult).flat();
        queries = removeDuplicates(queries);
        return queries;
    } catch (error) {
        console.error('Error fetching trending queries:', error);
        return [];
    }
}

export {
    fetchTrendingQueries
};