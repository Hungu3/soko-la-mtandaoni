# Soko la Mtandaoni

## Mwongozo wa Mfumo

Soko la Mtandaoni ni jukwaa la biashara linalowaunganisha wauzaji, wanunuzi na wasafirishaji Tanzania. Mfumo umejengwa kwa `Node.js`, `Express`, `SQLite` na `EJS`, na unafanya kazi kwenye browser ya kompyuta au simu.

Mwongozo huu unaeleza mfumo mzima hatua kwa hatua ili uweze kuusambaza kwa mnunuzi, mwekezaji au mshirika wa biashara.

## 1. Mfumo Unafanya Nini?

Mfumo unawezesha:

- Muuzaji kufungua duka, kuweka bidhaa na kuwasiliana na wanunuzi.
- Mnunuzi kutafuta maduka na bidhaa bila akaunti.
- Mnunuzi aliyeingia kuomba usafirishaji wa Public au Protected.
- Msafirishaji kuona na kuchukua maombi ya usafirishaji.
- Pande zote kujadiliana bei ya usafirishaji kwenye mazungumzo.
- Pickup na delivery kuthibitishwa kwa codes za usalama.
- Muuzaji kulipia kiwango cha duka kwa siku 30.
- Mfumo kurudisha akaunti kwenye Free baada ya subscription kuisha.
- Mfumo kuchagua bidhaa zitakazoendelea kuonekana baada ya kurudi Free.
- Mmiliki kusimamia wauzaji, wasafirishaji, matangazo, malalamiko na mipangilio.
- Mtumiaji kuchagua Light Mode au Dark Mode.

## 2. Aina za Watumiaji

### 2.1 Mnunuzi

Mnunuzi anaweza:

1. Kufungua homepage bila kujisajili.
2. Kutafuta bidhaa kwa jina, kategoria au jina la duka.
3. Kuona ukurasa wa duka, picha, bei, maelezo, rating na eneo.
4. Kuwasiliana na muuzaji kwa taarifa za simu.
5. Kujisajili ili kutumia usafirishaji wa Public au Protected.
6. Kuweka eneo la kupeleka bidhaa kwenye ramani.
7. Kutoa mapendekezo ya gharama ya usafirishaji.
8. Kuona mazungumzo kati yake, muuzaji na msafirishaji.
9. Kumpa msafirishaji Delivery Code wakati wa kukabidhiwa bidhaa.
10. Kuacha maoni ya bidhaa baada ya manunuzi.

Usafirishaji wa Public/Protected unahitaji akaunti ya mnunuzi iliyoingia. Usafirishaji wa Private unaweza kupangwa moja kwa moja kati ya mnunuzi na muuzaji nje ya mfumo.

### 2.2 Muuzaji

Muuzaji anaweza:

1. Kujisajili kwa jina la duka, aina ya bidhaa, simu, email, eneo na taarifa za utambulisho.
2. Kusubiri Admin aidhinishe duka.
3. Kuingia kwa simu au email.
4. Kuongeza, kuhariri na kuondoa bidhaa.
5. Kuweka picha, bei, stock, maelezo na gharama ya usafirishaji.
6. Kubadilisha picha, eneo, maelezo, saa za biashara na rangi ya duka.
7. Kuona maoni ya wateja na kujibu kulingana na kiwango.
8. Kuona maombi ya usafirishaji na kushiriki kwenye mazungumzo ya bei.
9. Kulipia kiwango cha duka kwa siku 30.
10. Kuona tarehe ambayo subscription itaisha.

### 2.3 Mwasafirishaji

Mwasafirishaji anaweza:

1. Kujisajili kwa jina, simu, email, aina ya gari, namba ya usajili, leseni na eneo la huduma.
2. Kusubiri Admin athibitishe taarifa zake.
3. Kuona maombi ya Public/Protected yaliyo wazi.
4. Kukubali au kukataa ombi la usafirishaji.
5. Kujadiliana bei na mnunuzi/muuzaji.
6. Kuthibitisha kuchukua bidhaa kwa Pickup Code.
7. Kuanza safari baada ya pickup kuthibitishwa.
8. Kuthibitisha kukabidhi bidhaa kwa Delivery Code.
9. Kulipia kiwango cha mwasafirishaji kwa siku 30.

### 2.4 Admin/Mmiliki

Mmiliki ndiye mwenye udhibiti mkuu wa mfumo. Anaweza:

- Kuona takwimu za jukwaa.
- Kuidhinisha, kukataa au kusimamisha wauzaji.
- Kuidhinisha, kukataa au kusimamisha wasafirishaji.
- Kusimamia bidhaa zote.
- Kuchapisha au kukataa maoni.
- Kushughulikia malalamiko.
- Kusimamia matangazo ya kawaida na Ads.
- Kubadilisha bei za viwango.
- Kuona historia ya subscriptions na malipo yaliyorekodiwa.
- Kusajili na kusimamia Staff.
- Kurejesha rekodi zilizofichwa na Staff.

### 2.5 Staff/Msimamizi

Staff husaidia kuendesha jukwaa, lakini hana access ya masuala ya pesa. Staff hawezi:

- Kuona mapato ya mfumo.
- Kubadilisha ada za viwango.
- Kusimamia malipo ya subscription.
- Kuidhinisha upgrade za malipo.

Staff akifuta rekodi, rekodi hufichwa kwa soft delete badala ya kufutwa kabisa. Mmiliki anaweza kuiona na kuirejesha.

## 3. Viwango vya Maduka

| Kiwango | Bidhaa | Picha kwa bidhaa | Bei ya mwezi |
|---|---:|---:|---:|
| FREE | 20 | 2 | 0 TSH |
| BRONZE | 100 | 5 | 10,000 TSH |
| SILVER | 300 | 10 | 25,000 TSH |
| GOLD | Bila kikomo | Bila kikomo | 50,000 TSH |

Bei zinaweza kubadilishwa na Mmiliki kupitia Admin settings.

### 3.1 Jinsi Subscription Inavyofanya Kazi

1. Muuzaji anaingia kwenye **Duka Langu > Boresha Duka Lako**.
2. Anachagua BRONZE, SILVER au GOLD.
3. Mfumo unaonyesha bei ya kiwango.
4. Muuzaji anachagua njia ya malipo: M-Pesa, T-Pesa, Airtel Money au Benki.
5. Anaweka namba ya muamala.
6. Anabofya **Lipa na Boresha**.
7. Mfumo unaanza subscription ya siku 30 mara moja bila approval ya Admin.
8. Mfumo unaonyesha tarehe ya mwisho wa subscription.
9. Subscription ikiisha, mfumo unarudisha duka kwenye FREE.
10. Mfumo unaweka bidhaa zote offline kisha unaacha bidhaa 20 za hivi karibuni zikiwa online.
11. Muuzaji anaonyeshwa ujumbe wa kuendelea kulipia au kubaki Free.
12. Akilipa tena, mfumo unaweka bidhaa zote za duka online tena.

Mfumo hauzuii data ya bidhaa kufutwa. Bidhaa zinazowekwa offline zinabaki kwenye dashboard ya muuzaji na zinaweza kurudi online baada ya renewal.

> **Muhimu:** Toleo la sasa linahifadhi namba ya muamala na kuactivate subscription moja kwa moja. API halisi ya M-Pesa/T-Pesa/Airtel bado inahitaji kuunganishwa na credentials za provider kabla ya production ya malipo ya kiotomatiki.

## 4. Viwango vya Wasafirishaji

Viwango vya mwasafirishaji hutegemea aina ya gari:

- Bodaboda: FREE 5, BRONZE 40, SILVER 150, GOLD bila kikomo kwa mwezi.
- Gari ndogo: FREE 8, BRONZE 60, SILVER 250, GOLD bila kikomo kwa mwezi.
- Gari kubwa: FREE 10, BRONZE 80, SILVER 350, GOLD bila kikomo kwa mwezi.
- Lori: FREE 3, BRONZE 30, SILVER 150, GOLD bila kikomo kwa mwezi.

Upgrade ya mwasafirishaji pia inalipiwa kwa siku 30 kwa njia na reference ya muamala.

## 5. Utafutaji na Priority ya Bidhaa

Bidhaa za maduka yenye viwango vya juu hupewa priority kwenye homepage na search:

1. GOLD
2. SILVER
3. BRONZE
4. FREE

Bidhaa iliyowekwa offline kwa sababu ya expiry haionekani kwa wanunuzi, lakini bado inaonekana kwa muuzaji ndani ya dashboard yake.

## 6. Matangazo na Ads

Mfumo una aina mbili za matangazo:

### Tangazo la Kawaida

Ni tangazo la taarifa za jukwaa. Linaweza kuwa picha au video na linaweza kuwa na maelezo pamoja na link.

### Ad Iliyolipiwa

Ad inaweza kuwa na:

- Kichwa.
- Caption.
- Picha au video.
- Link ya kubofya.
- Jina la mtangazaji.
- Ukubwa wa file.
- Muda wa kutangazwa.
- Tarehe ya kuanza na ku-expire.

Gharama ya Ad inakadiriwa kwa formula:

`max(1 MB, ukubwa wa file) x idadi ya siku x 500 TSH`

Ad hupangwa kwa priority kulingana na kiasi kilicholipwa na huondolewa kwenye matangazo hai baada ya expiry. Mmiliki ndiye anayedhibiti sehemu za kifedha za Ads.

## 7. Usafirishaji wa Public, Protected na Private

### Public

Ombi linaonekana kwa wasafirishaji walioidhinishwa na mmoja wao anaweza kulikubali.

### Protected

Ni usafirishaji wa ndani ya mfumo wenye mazungumzo na uthibitisho wa hatua kwa hatua.

### Private

Mnunuzi na muuzaji hupanga usafirishaji wao wenyewe nje ya mfumo. Muuzaji anaweza kurekodi taarifa zake kwenye dashboard.

## 8. Verification ya Usafirishaji

Mfumo hutumia codes za tarakimu sita:

1. Mnunuzi anaomba usafirishaji.
2. Mfumo unatengeneza Pickup Code na Delivery Code.
3. Msafirishaji akikubali, status inakuwa `imekubaliwa`.
4. Wakati wa kuchukua bidhaa, muuzaji/mnunuzi humpa msafirishaji Pickup Code.
5. Msafirishaji akiweka code sahihi, status inakuwa `inasafirishwa`.
6. Wakati wa kukabidhi, mnunuzi humpa msafirishaji Delivery Code.
7. Msafirishaji akiweka code sahihi, status inakuwa `imewasili`.
8. Mfumo huhifadhi muda wa pickup na delivery verification.

Hatua hii inazuia mtu kubadilisha order kuwa imewasili bila uthibitisho wa mnunuzi.

## 9. Light Mode na Dark Mode

Kwenye navigation kuna switch ya Light/Dark:

1. Bonyeza switch yenye alama ya jua au mwezi.
2. Mfumo hubadilisha rangi ya ukurasa mara moja.
3. Chaguo huhifadhiwa kwenye browser kupitia `localStorage`.
4. Ukirudi tena, mfumo hutumia mode uliyokuwa umechagua.
5. Mara ya kwanza mfumo huangalia pia preference ya device.

## 10. Ramani

Mfumo unatumia Leaflet na OpenStreetMap:

- Muuzaji anaweka eneo la duka kwa kubofya ramani.
- Eneo la duka linaonekana kwa mnunuzi.
- Mnunuzi anaweka eneo la kupeleka bidhaa.
- GPS latitude na longitude huhifadhiwa kwenye database.
- Google Maps API key haihitajiki kwa mfumo wa sasa.

## 11. Hatua za Kuanza Mfumo Kwenye Windows

### Njia rahisi

1. Fungua folder ya mfumo.
2. Bofya mara mbili `anza.bat`.
3. Script itaangalia Node.js.
4. Itaendesha `npm install`.
5. Itaandaa database na Admin.
6. Itaendesha mfumo.
7. Fungua `http://localhost:3000`.

### Njia ya PowerShell

```powershell
cd "C:\Users\hungu\OneDrive\Kazi mradi\Soko-la-Mtandaoni\soko"
npm install
npm run seed
npm start
```

Fungua:

- Tovuti: `http://localhost:3000`
- Admin: `http://localhost:3000/admin/ingia`

### Mac/Linux

```bash
bash anza.sh
```

## 12. Environment Variables

Tengeneza `.env` kutoka `.env.example` na weka:

```env
PORT=3000
SESSION_SECRET=weka_secret_ndefu_na_ya_nasibu
ADMIN_EMAIL=admin@soko.co.tz
ADMIN_PASSWORD=badilisha-password-hii
```

Usipakie `.env` au `data/` kwenye repository ya public.

## 13. Akaunti za Demo

Akaunti hizi hutengenezwa na seed ya kwanza:

| Aina | Simu | Email | Password |
|---|---|---|---|
| Admin | - | `admin@soko.co.tz` | `Soko@2026` |
| Staff | `0718901234` | `neema.msimamizi@mfano.co.tz` | `demo1234` |
| Muuzaji | `0712345678` | `mamaamina@mfano.co.tz` | `demo1234` |
| Mwasafirishaji | `0715678901` | `juma.dereva@mfano.co.tz` | `demo1234` |
| Mnunuzi | `0717890123` | `asha.mnunuzi@mfano.co.tz` | `demo1234` |

Badilisha au futa akaunti za demo kabla ya mfumo kwenda live.

## 14. Kuweka Mfumo Live

Mfumo unaweza kuwekwa Render, Railway au VPS.

### Render/Railway

1. Weka code kwenye GitHub bila `node_modules`, `.env` na `data/`.
2. Tengeneza Web Service.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Weka `SESSION_SECRET`, `ADMIN_EMAIL` na `ADMIN_PASSWORD` kwenye environment variables.
6. Tumia persistent disk/volume kwa `data/` na `public/uploads/`.
7. Weka custom domain na HTTPS.

### VPS

```bash
npm install
npm install -g pm2
pm2 start server.js --name soko
pm2 save
```

Tumia Nginx kama reverse proxy na Certbot kwa HTTPS.

## 15. Usalama Kabla ya Production

- Badilisha Admin password ya demo.
- Tumia `SESSION_SECRET` ndefu na ya kipekee.
- Wezesha HTTPS.
- Usipakie `.env`, `data/` au session files kwenye GitHub public.
- Unganisha payment provider halisi kabla ya kutegemea transaction references.
- Weka backup ya `data/soko.db` na `public/uploads/`.
- Weka upload size limits na virus/file validation kwa production.
- Ongeza SMS/email notifications kwa order na subscription expiry.
- Weka audit log ya malipo na mabadiliko ya Admin.

## 16. Muundo wa Folda

```text
soko/
  server.js                 Kianzio cha Express
  package.json              Maktaba na commands
  db/db.js                  SQLite schema, migrations na subscription logic
  db/seed.js                Admin na demo data
  middleware/auth.js        Ulinzi wa akaunti na permissions
  middleware/upload.js      Upload ya picha/files
  routes/main.js            Homepage, search, bidhaa na delivery request
  routes/auth.js            Usajili na login
  routes/seller.js          Seller dashboard na subscription
  routes/driver.js          Driver dashboard na verification
  routes/admin.js           Admin dashboard na usimamizi
  views/                    EJS pages na partials
  public/css/style.css      Design system na Light/Dark mode
  public/js/theme.js        Theme switcher
  public/uploads/           Picha zilizopakiwa
  data/                     SQLite database na sessions
```

## 17. Troubleshooting

### Port 3000 tayari inatumika

Tumia port nyingine:

```powershell
$env:PORT=3001
npm start
```

### `Cannot find module 'node:sqlite'`

Sakinisha Node.js 22.5 au zaidi.

### Homepage haionyeshi mabadiliko

1. Restart `npm start`.
2. Bonyeza `Ctrl + F5` kwenye browser.
3. Hakikisha unafungua port ile ile ambayo server inaendesha.

### Database haijabadilika

Usifute `data/soko.db` kama kuna data muhimu. Mfumo unaendesha migrations unapowashwa. Fanya backup kwanza.

## 18. Kazi Zinazofuata Kwa Toleo la Production

- Kuunganisha M-Pesa Daraja, Tigo Pesa au Airtel Money API.
- Kutuma SMS ya Pickup Code na Delivery Code.
- Kutuma reminder ya subscription siku 7, 3 na 1 kabla ya expiry.
- Kutengeneza mobile app ya Android/iOS.
- Kuongeza payment receipts na invoice.
- Kuongeza dispute/refund workflow ya usafirishaji.
- Kuongeza analytics ya clicks, impressions na conversions za Ads.
- Kuongeza automated backups na monitoring.

## 19. International Expansion: Vipengele vya Kimataifa

Sehemu hii inaeleza kwa uaminifu ni nini kiko tayari kwenye code, ni nini kinaweza kuanza bila credentials za huduma za nje, na ni nini kinahitaji akaunti/API kabla ya kutengenezwa kikamilifu.

### 19.1 Mfumo wa Malipo (Payment Gateways)

#### Hali ya sasa

- Mfumo una tiers za FREE, BRONZE, SILVER na GOLD.
- Mfumo huhifadhi njia ya malipo, namba ya muamala, kiasi na tarehe ya subscription.
- Subscription huanza kwa siku 30 baada ya muuzaji kuweka payment reference.
- Hakuna API ya benki au wallet iliyounganishwa bado; payment reference ya sasa ni rekodi ya ndani, si uthibitisho wa moja kwa moja kutoka kwa provider.

#### Chaguo zinazopendekezwa

Kwa malipo ya kimataifa, tumia moja ya hizi:

- **Stripe Checkout/Payment Intents:** Visa, Mastercard, American Express, Apple Pay na Google Pay kulingana na nchi.
- **PayPal Checkout:** kwa akaunti za PayPal na kadi zinazokubaliwa na PayPal.
- **Flutterwave au Paystack:** chaguo zuri kwa kadi, mobile money na nchi za Afrika zinazoungwa mkono.
- **Crypto kwa hiari:** Coinbase Commerce au processor mwingine wa crypto kwa USDT/miamala mingine, baada ya kuchunguza compliance na risk ya chargeback.

#### Kile kinachohitajika kabla ya integration

Mmiliki atahitaji kutoa provider anayochagua, merchant account, API keys za test/live, currency inayopokelewa, webhook secret na sera ya refund. Bila taarifa hizo si salama kuweka payment code ya production, kwa sababu keys haziwezi kuwekwa ndani ya source code.

#### Mtiririko wa production unaopendekezwa

1. Mfumo unatengeneza checkout session kwa tier na siku 30.
2. Mteja analipia ndani ya hosted checkout ya provider.
3. Provider anatuma webhook iliyosainiwa kwenye mfumo.
4. Mfumo unathibitisha webhook, payment status, amount, currency na transaction ID.
5. Subscription inaanza baada ya `payment_succeeded`, si baada ya mtumiaji kuandika reference pekee.
6. Mfumo unaweka invoice, receipt, refund status na audit log.

### 19.2 Lugha na Currency (Multi-Language & Multi-Currency)

#### Hali ya sasa

- Mfumo una Kiswahili kama lugha kuu.
- Light/Dark mode ipo na huhifadhiwa kwenye browser.
- Bei za sasa zinaonyeshwa kwa TSH.
- Dropdown ya Swahili, English, French na Spanish pamoja na automatic currency conversion bado haijaongezwa.

#### Kile kinachowezekana kuongezwa

- Kutumia translation dictionary kwa `sw`, `en`, `fr` na `es`, badala ya kutafsiri strings ndani ya EJS kila ukurasa.
- Kuhifadhi lugha kwenye session/cookie na kuanza na lugha inayochaguliwa na mtumiaji.
- Kuhifadhi bei ya msingi kwenye TSH, kisha kuonyesha converted display price kwa USD, EUR au currency ya eneo.
- Kutumia API ya exchange rates yenye cache na timestamp, kwa mfano Open Exchange Rates, CurrencyAPI au provider mwingine.
- Kutambua nchi kwa IP kama suggestion tu; mtumiaji apewe uwezo wa kubadilisha currency mwenyewe kwa sababu IP/VPN si uthibitisho wa eneo.

#### Tahadhari ya currency

Bei ya kubadilishwa kwa kuonyesha tu si sawa na currency ya malipo. Order na payment lazima ihifadhi `base_amount`, `base_currency`, `display_amount`, `display_currency`, exchange rate na muda wa rate. Provider wa payment ndiye aamue currencies zinazokubalika.

### 19.3 Usafirishaji wa Kimataifa (Global Shipping API)

#### Hali ya sasa

- Mfumo una delivery requests, locations, mazungumzo ya gharama, driver assignment na Pickup/Delivery Codes.
- Usafirishaji wa sasa ni workflow ya ndani ya jukwaa; haujaunganishwa na DHL, FedEx, Aramex au UPS.

#### Integration inayohitajika

Kwa kila kampuni, mteja atahitaji courier account, API key, origin address, package dimensions, weight, service level na pickup credentials. API hizi zinahitaji kuunganishwa kwenye server, si browser, kwa sababu keys ni siri.

Mfumo wa integration utahitaji:

1. Kuhifadhi uzito, urefu, upana, kimo, declared value na HS code ya bidhaa.
2. Kutuma origin, destination na package details kwenye courier API.
3. Kuonyesha shipping quotes za DHL Express, FedEx, Aramex au UPS.
4. Kuruhusu mnunuzi kuchagua service na kukubali quote yenye expiry.
5. Kutengeneza shipment, label na tracking number baada ya payment/order confirmation.
6. Kupokea tracking webhooks na kusasisha status ya delivery.
7. Kuhifadhi customs documents, duties na insurance kama shipment ni ya kimataifa.

Haiwezekani kuahidi gharama sahihi ya shipping bila package weight/dimensions na courier credentials; kwa sasa mfumo utumie gharama inayokubaliwa kwenye delivery conversation.

### 19.4 Cloud Infrastructure na CDN

#### Hali ya sasa

- Mfumo unaweza kuendeshwa kwenye Render, Railway au VPS.
- Picha na database vinahitaji persistent storage.
- CDN haijawekwa moja kwa moja ndani ya code.

#### Mpangilio unaopendekezwa

- **Cloudflare:** DNS, HTTPS, WAF, rate limiting na caching ya static assets.
- **AWS CloudFront:** CDN mbele ya object storage kama S3 kwa picha na video.
- **Object storage:** Hamisha `public/uploads/` kwenda S3/R2 wakati wa production yenye traffic kubwa.
- **Database:** SQLite inafaa kwa deployment ndogo yenye persistent disk; kwa scale ya kimataifa tumia PostgreSQL managed database.
- **Process/runtime:** PM2 au managed service yenye health checks, logs, backups na restart policy.

CDN haiwezi kusuluhisha database scaling au upload storage yenyewe. Hayo yanahitaji architecture ya storage na database tofauti.

### 19.5 Muda wa Kimataifa (UTC na Timezones)

- SQLite `CURRENT_TIMESTAMP` huhifadhi muda wa UTC.
- Tarehe za subscription hutumwa kwa ISO format, hivyo zina timezone inayoweza kuhifadhiwa bila kupotea.
- Kwa production, hifadhi timestamps zote za orders, payments, webhooks na emails kwa UTC.
- Onyesha muda kwa timezone ya mtumiaji kwenye UI, lakini usibadilishe timestamp ya database kuwa local time.
- Hifadhi timezone preference ya account kama mtumiaji anahitaji reminders za ndani ya nchi yake.

Kwa reminders, expiry na webhooks, tumia server time ya UTC na job scheduler. Usitumie saa ya browser kama chanzo cha kuamua payment au expiry.

### 19.6 Sheria na Ulinzi wa Data

Toleo la sasa lina pages za `/privacy` na `/terms`, links kwenye footer, pamoja na cookie banner ya msingi kwa cookies za session na theme. Hizi ni templates za kuanzia na zinapaswa kukaguliwa/kusainiwa na mtaalamu wa sheria kabla ya kuuza kimataifa.

Vipengele vifuatavyo bado vinahitaji kuongezwa kwa production:

- Cookie consent categories za kina na uwezo wa withdrawal wa kila category.
- Export na deletion request ya taarifa za mtumiaji.
- Data retention policy na audit trail ya access ya Staff/Admin.
- Processor agreements kwa hosting, email, payment na analytics providers.
- Ulinzi wa watoto, fraud prevention na breach response procedure.

Hati za sheria zinapaswa kuandaliwa na mtaalamu wa sheria anayejua Tanzania, GDPR na nchi ambazo biashara inalenga. README hii si ushauri wa kisheria.

### 19.7 VAT, Sales Tax na Customs

Automatic VAT/sales tax haijaongezwa kwa sasa. Kwa integration ya production, mfumo utahitaji:

1. Buyer country, seller country na shipping destination.
2. Product tax category na, kwa bidhaa za kimataifa, HS code.
3. Tax registration numbers za biashara inapohitajika.
4. Tax engine kama Avalara, TaxJar au provider wa eneo husika, au rules zilizothibitishwa na mhasibu.
5. Kutenganisha product price, shipping, tax, customs duty na total.
6. Invoice yenye currency, tax rate, tax amount na taarifa za seller/buyer.
7. Handling ya refunds na tax adjustments.

Customs duty haiwezi kuhesabiwa kwa usahihi kwa nchi zote bila product classification, origin, destination na rules za nchi husika. Usionyeshe tax estimate kama invoice ya mwisho bila tax provider au mhasibu kuithibitisha.

### 19.8 Mpangilio wa Utekelezaji Unaopendekezwa

1. Kamilisha production payment gateway moja, ikiwezekana Stripe au Flutterwave/Paystack kulingana na nchi za wateja.
2. Ongeza webhook verification, invoices, refunds na subscription audit logs.
3. Ongeza translation dictionary na language dropdown.
4. Ongeza currency display yenye cached exchange rates; payment currency ibaki ikidhibitiwa na provider.
5. Ongeza package weight/dimensions na integration ya courier mmoja kwanza.
6. Weka Cloudflare/HTTPS, backups, monitoring na object storage.
7. Ongeza Privacy Policy, Terms, Cookie Consent na data deletion flow.
8. Ongeza tax calculation baada ya kujua nchi zinazolengwa na ushauri wa mtaalamu.
9. Kisha ongeza courier wa pili, lugha zaidi, currencies zaidi na crypto ikiwa kuna hitaji la biashara.

## 20. Vipengele Vipya Vilivyowekwa Kwenye Website

### 20.1 Escrow ya Malipo

Delivery thread sasa ina sehemu ya **Pending Payment**. Mnunuzi anaweza kuweka kiasi na payment reference baada ya gharama kukubaliwa. Mfumo huhifadhi malipo kama `held`, na wakati Delivery Code inathibitishwa hubadilisha hali kuwa `released`.

Kwa sasa hii ni escrow ledger ya ndani: haikati pesa moja kwa moja kutoka kadi/wallet. Ili fedha halisi zishikiliwe na kuachiliwa, payment gateway yenye webhook ya `payment_succeeded`, capture, refund na payout lazima iunganishwe.

### 20.2 KYC Verification

Seller na driver wanapakia kitambulisho wakati wa usajili. Admin/Mmiliki anaona nyaraka na anaweza kubonyeza **Verify KYC**. Mfumo huhifadhi `pending`, `verified` au `rejected` pamoja na muda na admin aliyefanya review.

### 20.3 In-App Chat

Delivery thread sasa ina chat ya ndani inayohusisha mnunuzi, muuzaji na driver wa order hiyo. Ujumbe huhifadhiwa kwenye database kwa ajili ya history na ushahidi wa migogoro; mawasiliano hayalazimiki kuhamia WhatsApp.

### 20.4 Dispute na Refund Workflow

Mnunuzi anaweza kubonyeza **Fungua Mgogoro** kwenye delivery thread na kuchagua sababu kama bidhaa si sahihi, haijafika au imeharibika. Owner anaona migogoro kwenye **Admin > Migogoro na Refunds**, kisha anaweza kuchagua `Refund` au `Release`.

Refund ya sasa ni rekodi ya hali ya escrow. Refund halisi kwa kadi/wallet itafanywa na payment gateway baada ya integration ya provider.

### 20.5 Rate Limiting

Server sasa ina rate limiter ya msingi inayoruhusu hadi requests 100 kwa dakika kwa IP/path. Ikizidi, mfumo hurudisha `429`. Kwa production yenye traffic kubwa, tumia Cloudflare WAF/rate limiting na Redis-backed limiter badala ya memory ya process moja.

### 20.6 Lugha na Currency Selector

Header ya public website sasa ina:

- Lugha: `SW` na `EN`.
- Currency preference: `TSH`, `USD` na `EUR`.
- Chaguo huhifadhiwa kwenye browser.
- Navigation labels kuu hubadilika kwa Swahili/English.
- Bei zinazoonyeshwa kwa `TSH` hubadilishwa papo hapo kuwa currency iliyochaguliwa bila reload.

Conversion ya sasa ni ya display tu na inatumia rates za mfano zilizowekwa kwenye frontend (`1 USD = 2,600 TSH`, `1 EUR = 2,900 TSH`). Automatic exchange-rate API, cache, base currency ya order na rules za payment provider bado vinahitaji kuunganishwa.

### 20.7 Cloudflare na SSL

Cloudflare haiwezi kuanzishwa kutoka kwenye code bila domain/DNS access. Baada ya kununua domain, weka DNS kupitia Cloudflare, SSL mode ya Full/Strict, WAF, rate limiting na cache ya static files. Hakuna API key ya Cloudflare iliyowekwa kwenye repository.

### 20.8 Owner Dashboard, RBAC na Security

- Owner dashboard sasa inatenganisha makadirio ya mapato, mapato halisi yaliyorekodiwa na pesa zilizoshikiliwa kwenye escrow.
- Owner anaweza kuchagua TSH, USD au EUR kwenye analytics. Conversion ya sasa ni indicative ya UI yenye rates za mfano; exchange-rate API ya live bado inahitaji kuunganishwa.
- Admin na Staff wanahitaji password pamoja na `ADMIN_2FA_CODE` ya pili kabla ya kuingia dashboard.
- Session ya Admin/Staff hu-expire baada ya dakika 20 bila activity.
- Staff haoni menu ya Masuala ya Pesa, Staff management, Migogoro na Refunds, wala Audit Logs.
- Owner anaona `/admin/logs`, inayorekodi actions za Admin/Staff bila kuhifadhi password au payment reference.
- Driver hawezi kuidhinishwa kubeba mizigo mpaka KYC yake iwe `verified`.
