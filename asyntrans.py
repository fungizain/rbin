# -*- coding: utf-8 -*-
import asyncio
import tqdm
import json, requests
from urllib.parse import quote
from aiohttp import ClientSession, ClientTimeout

import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

URLS_SUFFIX_DEFAULT = 'cn'

# class Translator:

#     def __init__(self, timeout=5):
#         self.url_suffix = URLS_SUFFIX_DEFAULT
#         url_base = f"https://translate.google.{self.url_suffix}"
#         self.url = url_base + "/_/TranslateWebserverUi/data/batchexecute"
#         self.timeout = timeout

#     def _package_rpc(self, text, lang_src='auto', lang_tgt='auto'):
#         parameter = [[text.strip(), lang_src, lang_tgt, True], [1]]
#         escaped_parameter = json.dumps(parameter, separators=(',', ':'))
#         rpc = [[["MkEWBc", escaped_parameter, None, 'generic']]]
#         escaped_rpc = json.dumps(rpc, separators=(',', ':'))
#         freq = f"f.req={quote(escaped_rpc)}&"
#         return freq

#     def _extract(self, line):
#         line = line + ']'
#         line = json.loads(line)
#         line = list(line)
#         line = json.loads(line[0][2])
#         return list(line)[1][0]

#     def translate(self, text, lang_src='auto', lang_tgt='en', pronounce=False):
#         text = str(text)
#         headers = {
#             "Referer": f"https://translate.google.{self.url_suffix}",
#             "User-Agent":
#                 "Mozilla/5.0 (Windows NT 10.0; WOW64) "
#                 "AppleWebKit/537.36 (KHTML, like Gecko) "
#                 "Chrome/47.0.2526.106 Safari/537.36",
#             "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
#         }
#         freq = self._package_rpc(text, lang_src, lang_tgt)
#         response = requests.Request(method='POST', url=self.url, data=freq, headers=headers)
#         try:
#             with requests.Session() as s:
#                 r = s.send(
#                     request=response.prepare(),
#                     verify=False,
#                     timeout=self.timeout
#                 )
#             for line in r.iter_lines(chunk_size=1024):
#                 line = line.decode('utf-8')
#                 try:
#                     response = self._extract(line)
#                     if len(response) == 1:
#                         if len(response[0]) > 5:
#                             sentences = response[0][5]
#                         else:
#                             sentences = response[0][0]
#                             return sentences
#                         translate_text = ""
#                         for sentence in sentences:
#                             sentence = sentence[0]
#                             translate_text += sentence.strip() + ' '
#                         translate_text = translate_text
#                         return translate_text
#                     elif len(response) == 2:
#                         sentences = []
#                         for i in response:
#                             sentences.append(i[0])
#                         return sentences
#                 except:
#                     pass
#             r.raise_for_status()
#         except:
#             raise Exception

def get_paras(text):
    url_base = f"https://translate.google.{URLS_SUFFIX_DEFAULT}"
    url = url_base + "/_/TranslateWebserverUi/data/batchexecute"
    
    headers = {
        "Referer": f"https://translate.google.{URLS_SUFFIX_DEFAULT}",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        "Cookie": "NID=205=AXw-zaiDjDnfZew7pUXQWqhD-BUCG_nsabcsxlS6PsvM0HZ2NUoWnpcH_rwMdHGhi6yS7kLalv05EvoxyfWOhlHDHZRx_zSFb0m-trya2gmGyWeGomVqOjcc9MyP6HrXz-RSlPXjw90kQyuRbT9ZycUNsJc9HHg4KU0fVZ0ZuD8",
    }

    lang_src, lang_tgt = 'auto', 'en'
    parameter = [[text.strip(), lang_src, lang_tgt, True], [1]]
    escaped_parameter = json.dumps(parameter, separators=(',', ':'))
    rpc = [[["MkEWBc", escaped_parameter, None, 'generic']]]
    escaped_rpc = json.dumps(rpc, separators=(',', ':'))
    data = f"f.req={quote(escaped_rpc)}&"
    
    return headers, url, data

def fetch(data):
    for line in data:
        if not 'MkEWBc' in line:
            continue
        try:
            line = line + ']'
            line = json.loads(line)
            line = list(line)
            line = json.loads(line[0][2])
            response = list(line)[1][0]
            if len(response) == 1:
                if len(response[0]) > 5:
                    sentences = response[0][5]
                else:
                    sentences = response[0][0]
                    return sentences
                translate_text = ""
                for sentence in sentences:
                    sentence = sentence[0]
                    translate_text += sentence.strip() + ' '
                translate_text = translate_text
                return translate_text
            elif len(response) == 2:
                sentences = []
                for i in response:
                    sentences.append(i[0])
                return sentences
        except:
            pass

async def trans(_index, _text, session):
    cookies = {
        "__Secure-3PSIDCC": "AJi4QfEm7CePeGgFYrWAwAPfnWvCtpRqPyP7HNuiDVdJnigUFBpA_BiLcGHd6P2-b89mqXOlkA",
        "SIDCC": "AJi4QfEq-QyMYwurCvUoKBdnJDBvazfKlsJWOME28GoUuFgCd_cWAv9ooBQ7CsU9pAC2HHnjVw",
    }
    headers, url, data = get_paras(_text)
    async with session.post(url=url, data=data, headers=headers) as r:
        res = await r.text()
        data = res.split('\n')
        tt = fetch(data)
        return tt
            
async def main(data):
    if not isinstance(data, dict):
        raise TypeError("Fuck you need dictionary ar")
    timeout = ClientTimeout(total=60)
    async with ClientSession(timeout=timeout) as session:
        tasks = [asyncio.create_task(trans(_index, _text, session)) for _index, _text in data.items()]
        # return await asyncio.gather(*tasks)
        for t in tqdm.tqdm(asyncio.as_completed(tasks, timeout=60), total=len(tasks)):
            await t
        ret = [t.result() for t in tasks]
        return ret
        
if __name__ == "__main__":
    data = {
        6: '返到門口 即刻ready拎電話出黎紀錄低 諗住伯伯見到我一係就喊住攬我 一係就興奮笑過黎要我抱 點知佢除左開門果刻對我笑左一下 之後半個鐘完全當我無到 又唔肯同我有眼神交流又唔俾我抱 剩係俾爸爸抱同爸爸玩 我嗰半個鐘簡直覺得心如刀割 明明老公個個星期都出幾日work trip 我先第一次離開佢 佢竟然好似唔掛住我仲唔俾我抱 個心啲血流到成地都係差d要去輸血 到之後佢唔小心跌親少少係到喊 我即刻借機會抱實佢 佢到果刻終於箍到我實一實 之後我要出返去教瑜伽 佢又喊到就黎崩潰咁 之後再返到屋企佢先痴到我實 好似隻樹熊一樣 老公話bb根本鐘意佢多過我好多 唔見左幾日佢已經唔記得我 但就剩係記得爸爸 到聞到陣奶味先記得返我呢個奶樽 但爸爸媽媽又話bb係嬲左我 總之就到而家我都仲係心神恍惚 又非常之咁心淡 咁以後我都要有返自己既人生呀 佢都唔愛我既哼 付出咁多原來都係得個吉 唔通個仔同老公一樣咁鐘意激嬲我 happythanksgivng',
        7: '食埋呢餐就返香港啦 本身以為呢個trip會好掛住細翟生 點知我竟然喊都無喊過咁冷血 可能因為知道到有家人同姐姐睇住佢 又有兩個表哥俾佢任勞任砌 佢無左我依然過得好風流 不過上機前緊張到有少少肚痛 因為唔知佢見到我會點 會唔會即刻過黎攪實我呢 未試過返香港咁興奮 媽媽狂想中 一齊估下佢係咩反應',
        8: '這次旅程老公也太配合了',
        9: '雖然去咗旅行 但係如果大家想既話都仲可以見到佢 只要去follow cghappykids_hk 就得啦 因為嚟緊我會用星 吸 牛牛媽身分 接替cow cow 係牛欄牌嘅帳號5 日 share我同伯伯平時嘅生活點滴 仲會親身覆你地既留言 作為星 吸 牛牛媽當然要識得 喺生活小事去欣賞小朋友不同既小進步 俾小朋友做返小朋友 用佢嘅童真佢探索呢個大世界 尤其小朋友過左1歲真係每一日都有驚喜 帶畀媽媽好多快樂同安慰 想睇我同伯伯嘅生活就記得follow cghappykids_hk 到時仲有獨家IG story 牛牛媽特約 約咗Coffee同伯伯 星吸牛牛媽 明日開始 讓孩子做孩子 吸收美好大世界 牛欄牌 letkidsbekidshk 跟著伯伯去生活',
        10: '煳辣當道 一一一一一一一一一一一一一一 新出嘅三哥煳辣味薯片 你食左未呢 食食吓又會唔會掛住三哥嘅煳辣米線 咁不如試下兩溝啦 拿 絕非黑暗料理 其實味道係ok架 煳辣湯既香料味 加上浸到淋淋地微微脆既薯片 香料味升level 食落係另一番風味喔 注意薯片係三哥無得賣架 係自己帶入去架 餐廳亦冇提供上述薯片米線 大家有興趣不妨自己挑戰下 一一一一一一一一一一一一一一 餐廳 譚仔三哥米線',
    }
    result = asyncio.run(main(data))
    print(result)
