import { Route } from '@/types';
import { load } from 'cheerio';
import iconv from 'iconv-lite';
import got from '@/utils/got';

const baseURL = 'https://www.dytt89.com/i/';

export const route: Route = {
    path: '/tv/:id',
    categories: ['multimedia'],
    example: '/dytt/tv/112028',
    parameters: { id: '电视剧id url上获取如：https://www.dytt89.com/i/112028.html id为112028' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: true,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['www.dytt89.com/i/:id'],
            target: '/tv/:id',
        },
    ],
    name: '电视剧',
    maintainers: ['heroz08'],
    handler,
    url: 'dytt89.com/',
};

async function handler(ctx) {
    const { id } = ctx.req.param();
    const detailUrl = baseURL + id + '.html';
    const res = await got(detailUrl, {
        responseType: 'buffer',
    });
    res.data = iconv.decode(res.data, 'gb2312');
    const $ = load(res.data);

    const meta = getMeta($);
    const downlist = getDownList($, detailUrl);

    return {
        link: detailUrl,
        title: meta.title || 'dytt电视剧 - 详情',
        image: meta.cover,
        description: meta.description,
        item: downlist,
    };
}

function getMeta($) {
    const zoom = $('#Zoom');
    const playList = $('#Zoom p:first');
    const image = $('#Zoom img').attr('src');
    const zoomContent = zoom.text();
    const playListContent = playList.text();
    const metaText = zoomContent.split(playListContent)[0];
    const metaStr = metaText.replaceAll(/\s+/g, '');
    // 使用正则表达式提取片名
    const titleMatch = metaStr.match(/◎片名(.+?)◎/s);

    const title = titleMatch ? titleMatch[1].trim() : '';

    // 使用正则表达式提取简介
    const descriptionMatch = metaStr.match(/◎简介+(.*)$/s);
    const description = descriptionMatch ? descriptionMatch[1].trim() : '';

    return {
        title,
        description,
        cover: image,
    };
}

function getDownList($, detailUrl) {
    const downlist = $('#downlist');
    const items: any = [];

    downlist.find('a').each((index, ele) => {
        const current = $(ele);
        const name = String(current.text().split('&dn=')[1]);
        const url = current.attr('href');
        items.push({
            enclosure_url: url,
            enclosure_length: '',
            enclosure_type: `application/x-bittorrent`,
            title: name,
            link: detailUrl,
            guid: name,
        });
    });
    return items;
}
