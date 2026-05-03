"""
NSE Stocks Master List — NIFTY 500 + additional liquid stocks
Grouped by sector. Each entry: (yahoo_symbol, display_name, sector)
"""

NSE_STOCKS = [
    # ── LARGE CAP INDEX ──────────────────────────────────────────────────────
    # NIFTY 50 + NIFTY NEXT 50 core
    ("RELIANCE.NS",    "Reliance Industries",      "Energy"),
    ("TCS.NS",         "Tata Consultancy Services", "IT"),
    ("HDFCBANK.NS",    "HDFC Bank",                "Banking"),
    ("BHARTIARTL.NS",  "Bharti Airtel",            "Telecom"),
    ("ICICIBANK.NS",   "ICICI Bank",               "Banking"),
    ("INFOSYS.NS",     "Infosys",                  "IT"),
    ("SBIN.NS",        "State Bank of India",       "Banking"),
    ("HINDUNILVR.NS",  "Hindustan Unilever",        "FMCG"),
    ("ITC.NS",         "ITC",                      "FMCG"),
    ("LT.NS",          "Larsen & Toubro",           "Infrastructure"),
    ("KOTAKBANK.NS",   "Kotak Mahindra Bank",       "Banking"),
    ("AXISBANK.NS",    "Axis Bank",                "Banking"),
    ("BAJFINANCE.NS",  "Bajaj Finance",            "Finance"),
    ("ASIANPAINT.NS",  "Asian Paints",             "Consumer"),
    ("MARUTI.NS",      "Maruti Suzuki",            "Auto"),
    ("NESTLEIND.NS",   "Nestle India",             "FMCG"),
    ("TITAN.NS",       "Titan Company",            "Consumer"),
    ("ULTRACEMCO.NS",  "UltraTech Cement",         "Cement"),
    ("WIPRO.NS",       "Wipro",                    "IT"),
    ("ADANIENT.NS",    "Adani Enterprises",        "Conglomerate"),
    ("ADANIPORTS.NS",  "Adani Ports",              "Infrastructure"),
    ("SUNPHARMA.NS",   "Sun Pharmaceuticals",      "Pharma"),
    ("HCLTECH.NS",     "HCL Technologies",         "IT"),
    ("TECHM.NS",       "Tech Mahindra",            "IT"),
    ("POWERGRID.NS",   "Power Grid Corp",          "Power"),
    ("NTPC.NS",        "NTPC",                     "Power"),
    ("ONGC.NS",        "Oil & Natural Gas Corp",   "Energy"),
    ("TATAMTRDVR.NS",  "Tata Motors DVR",          "Auto"),
    ("TATASTEEL.NS",   "Tata Steel",               "Metal"),
    ("BAJAJFINSV.NS",  "Bajaj Finserv",            "Finance"),
    ("JSWSTEEL.NS",    "JSW Steel",                "Metal"),
    ("INDUSINDBK.NS",  "IndusInd Bank",            "Banking"),
    ("COALINDIA.NS",   "Coal India",               "Mining"),
    ("HINDALCO.NS",    "Hindalco Industries",      "Metal"),
    ("CIPLA.NS",       "Cipla",                    "Pharma"),
    ("DRREDDY.NS",     "Dr. Reddy's Laboratories", "Pharma"),
    ("DIVISLAB.NS",    "Divi's Laboratories",      "Pharma"),
    ("BRITANNIA.NS",   "Britannia Industries",     "FMCG"),
    ("EICHERMOT.NS",   "Eicher Motors",            "Auto"),
    ("GRASIM.NS",      "Grasim Industries",        "Cement"),
    ("APOLLOHOSP.NS",  "Apollo Hospitals",         "Healthcare"),
    ("TATACONSUM.NS",  "Tata Consumer Products",   "FMCG"),
    ("BAJAJ-AUTO.NS",  "Bajaj Auto",               "Auto"),
    ("HEROMOTOCO.NS",  "Hero MotoCorp",            "Auto"),
    ("BPCL.NS",        "Bharat Petroleum",         "Energy"),
    ("SHRIRAMFIN.NS",  "Shriram Finance",          "Finance"),
    ("M&M.NS",         "Mahindra & Mahindra",      "Auto"),
    ("SBILIFE.NS",     "SBI Life Insurance",       "Insurance"),
    ("HDFCLIFE.NS",    "HDFC Life Insurance",      "Insurance"),
    ("ICICIPRULI.NS",  "ICICI Prudential Life",    "Insurance"),

    # ── IT & TECH ────────────────────────────────────────────────────────────
    ("LTIM.NS",        "LTIMindtree",              "IT"),
    ("MPHASIS.NS",     "Mphasis",                  "IT"),
    ("PERSISTENT.NS",  "Persistent Systems",       "IT"),
    ("COFORGE.NS",     "Coforge",                  "IT"),
    ("LTTS.NS",        "L&T Technology Services",  "IT"),
    ("OFSS.NS",        "Oracle Financial Services","IT"),
    ("KPITTECH.NS",    "KPIT Technologies",        "IT"),
    ("TATAELXSI.NS",   "Tata Elxsi",               "IT"),
    ("MASTEK.NS",      "Mastek",                   "IT"),

    # ── BANKING & FINANCE ────────────────────────────────────────────────────
    ("BANDHANBNK.NS",  "Bandhan Bank",             "Banking"),
    ("FEDERALBNK.NS",  "Federal Bank",             "Banking"),
    ("IDFCFIRSTB.NS",  "IDFC First Bank",          "Banking"),
    ("PNB.NS",         "Punjab National Bank",     "Banking"),
    ("CANBK.NS",       "Canara Bank",              "Banking"),
    ("BANKBARODA.NS",  "Bank of Baroda",           "Banking"),
    ("UNIONBANK.NS",   "Union Bank of India",      "Banking"),
    ("MANAPPURAM.NS",  "Manappuram Finance",       "Finance"),
    ("MUTHOOTFIN.NS",  "Muthoot Finance",          "Finance"),
    ("CHOLAFIN.NS",    "Cholamandalam Finance",    "Finance"),
    ("M&MFIN.NS",      "M&M Financial Services",   "Finance"),
    ("SBICARD.NS",     "SBI Cards",                "Finance"),
    ("HDFCAMC.NS",     "HDFC AMC",                 "Finance"),
    ("NIPPONLIFE.NS",  "Nippon Life India AMC",    "Finance"),
    ("ICICIGI.NS",     "ICICI Lombard",            "Insurance"),

    # ── AUTO & EV ────────────────────────────────────────────────────────────
    ("TVSMOTOR.NS",    "TVS Motor Company",        "Auto"),
    ("ASHOKLEY.NS",    "Ashok Leyland",            "Auto"),
    ("BHARATFORG.NS",  "Bharat Forge",             "Auto"),
    ("MOTHERSON.NS",   "Motherson Sumi",           "Auto"),
    ("BOSCHLTD.NS",    "Bosch",                    "Auto"),
    ("APOLLOTYRE.NS",  "Apollo Tyres",             "Auto"),
    ("MRF.NS",         "MRF",                      "Auto"),
    ("CEAT.NS",        "CEAT",                     "Auto"),
    ("EXIDEIND.NS",    "Exide Industries",         "Auto"),
    ("SUNDRMFAST.NS",  "Sundram Fasteners",        "Auto"),

    # ── PHARMA & HEALTHCARE ──────────────────────────────────────────────────
    ("LUPIN.NS",       "Lupin",                    "Pharma"),
    ("BIOCON.NS",      "Biocon",                   "Pharma"),
    ("AUROPHARMA.NS",  "Aurobindo Pharma",         "Pharma"),
    ("TORNTPHARM.NS",  "Torrent Pharmaceuticals",  "Pharma"),
    ("ALKEM.NS",       "Alkem Laboratories",       "Pharma"),
    ("IPCALAB.NS",     "IPCA Laboratories",        "Pharma"),
    ("GLENMARK.NS",    "Glenmark Pharmaceuticals", "Pharma"),
    ("NATCOPHARM.NS",  "Natco Pharma",             "Pharma"),
    ("MAXHEALTH.NS",   "Max Healthcare",           "Healthcare"),
    ("FORTIS.NS",      "Fortis Healthcare",        "Healthcare"),
    ("MEDANTA.NS",     "Global Health (Medanta)",  "Healthcare"),
    ("METROPOLIS.NS",  "Metropolis Healthcare",    "Healthcare"),
    ("LALPATHLAB.NS",  "Dr. Lal PathLabs",         "Healthcare"),

    # ── FMCG & CONSUMER ─────────────────────────────────────────────────────
    ("DABUR.NS",       "Dabur India",              "FMCG"),
    ("MARICO.NS",      "Marico",                   "FMCG"),
    ("GODREJCP.NS",    "Godrej Consumer Products", "FMCG"),
    ("EMAMILTD.NS",    "Emami",                    "FMCG"),
    ("COLPAL.NS",      "Colgate-Palmolive India",  "FMCG"),
    ("VBL.NS",         "Varun Beverages",          "FMCG"),
    ("RADICO.NS",      "Radico Khaitan",           "FMCG"),
    ("UNITDSPR.NS",    "United Spirits",           "FMCG"),
    ("PAGEIND.NS",     "Page Industries",          "Consumer"),
    ("KALYANKJIL.NS",  "Kalyan Jewellers",         "Jewellery"),
    ("SENCO.NS",       "Senco Gold",               "Jewellery"),
    ("VMART.NS",       "V-Mart Retail",            "Retail"),
    ("DMART.NS",       "Avenue Supermarts (DMart)", "Retail"),
    ("TRENT.NS",       "Trent",                    "Retail"),

    # ── ENERGY & OIL ────────────────────────────────────────────────────────
    ("IOC.NS",         "Indian Oil Corporation",   "Energy"),
    ("HINDPETRO.NS",   "Hindustan Petroleum",      "Energy"),
    ("GAIL.NS",        "GAIL India",               "Energy"),
    ("PETRONET.NS",    "Petronet LNG",             "Energy"),
    ("IGL.NS",         "Indraprastha Gas",         "Energy"),
    ("MGL.NS",         "Mahanagar Gas",            "Energy"),
    ("GUJGASLTD.NS",   "Gujarat Gas",              "Energy"),

    # ── POWER & RENEWABLES ───────────────────────────────────────────────────
    ("TATAPOWER.NS",   "Tata Power",               "Power"),
    ("ADANIGREEN.NS",  "Adani Green Energy",       "Power"),
    ("ADANIPOWM.NS",   "Adani Power",              "Power"),
    ("TORNTPOWER.NS",  "Torrent Power",            "Power"),
    ("CESC.NS",        "CESC",                     "Power"),
    ("NHPC.NS",        "NHPC",                     "Power"),
    ("SJVN.NS",        "SJVN",                     "Power"),

    # ── METAL & MINING ──────────────────────────────────────────────────────
    ("VEDL.NS",        "Vedanta",                  "Metal"),
    ("SAIL.NS",        "Steel Authority of India", "Metal"),
    ("NMDC.NS",        "NMDC",                     "Mining"),
    ("HINDCOPPER.NS",  "Hindustan Copper",         "Metal"),
    ("NATIONALUM.NS",  "National Aluminium",       "Metal"),
    ("RATNAMANI.NS",   "Ratnamani Metals",         "Metal"),
    ("WELSPUNIND.NS",  "Welspun India",            "Textile"),
    ("APL.NS",         "APL Apollo Tubes",         "Metal"),

    # ── CEMENT & BUILDING ───────────────────────────────────────────────────
    ("AMBUJACEM.NS",   "Ambuja Cements",           "Cement"),
    ("ACC.NS",         "ACC",                      "Cement"),
    ("SHREECEM.NS",    "Shree Cement",             "Cement"),
    ("JKCEMENT.NS",    "JK Cement",                "Cement"),
    ("DALBHARAT.NS",   "Dalmia Bharat",            "Cement"),
    ("RAMCOCEM.NS",    "Ramco Cements",            "Cement"),
    ("STARCEMENT.NS",  "Star Cement",              "Cement"),
    ("PIDILITIND.NS",  "Pidilite Industries",      "Building Materials"),
    ("ASTRAL.NS",      "Astral",                   "Building Materials"),
    ("SUPREMEIND.NS",  "Supreme Industries",       "Building Materials"),
    ("CENTURYPLY.NS",  "Century Plyboards",        "Building Materials"),

    # ── INFRASTRUCTURE & CONSTRUCTION ───────────────────────────────────────
    ("IRB.NS",         "IRB Infrastructure",       "Infrastructure"),
    ("KPIL.NS",        "Kalpataru Projects",       "Infrastructure"),
    ("NCC.NS",         "NCC",                      "Infrastructure"),
    ("PFC.NS",         "Power Finance Corp",       "Finance"),
    ("RECLTD.NS",      "REC",                      "Finance"),
    ("IRFC.NS",        "Indian Railway Finance",   "Finance"),
    ("HUDCO.NS",       "Housing & Urban Dev",      "Finance"),
    ("NBCC.NS",        "NBCC India",               "Infrastructure"),

    # ── REAL ESTATE ──────────────────────────────────────────────────────────
    ("DLF.NS",         "DLF",                      "Real Estate"),
    ("GODREJPROP.NS",  "Godrej Properties",        "Real Estate"),
    ("OBEROIRLTY.NS",  "Oberoi Realty",            "Real Estate"),
    ("PHOENIXLTD.NS",  "Phoenix Mills",            "Real Estate"),
    ("PRESTIGE.NS",    "Prestige Estates",         "Real Estate"),
    ("BRIGADE.NS",     "Brigade Enterprises",      "Real Estate"),
    ("SOBHA.NS",       "Sobha",                    "Real Estate"),
    ("MAHLIFE.NS",     "Mahindra Lifespace",       "Real Estate"),

    # ── TELECOM & MEDIA ──────────────────────────────────────────────────────
    ("IDEA.NS",        "Vodafone Idea",            "Telecom"),
    ("INDUSTOWER.NS",  "Indus Towers",             "Telecom"),
    ("TATACOMM.NS",    "Tata Communications",      "Telecom"),
    ("SUNTV.NS",       "Sun TV Network",           "Media"),
    ("ZEEL.NS",        "Zee Entertainment",        "Media"),
    ("PVRINOX.NS",     "PVR INOX",                 "Media"),

    # ── AVIATION, TRAVEL & HOSPITALITY ──────────────────────────────────────
    ("INDIGO.NS",      "InterGlobe Aviation (IndiGo)", "Aviation"),
    ("SPICEJET.NS",    "SpiceJet",                 "Aviation"),
    ("IRCTC.NS",       "IRCTC",                    "Travel"),
    ("LEMONTRE.NS",    "Lemon Tree Hotels",        "Hospitality"),
    ("EIHOTEL.NS",     "EIH (Oberoi Hotels)",      "Hospitality"),
    ("INDHOTEL.NS",    "Indian Hotels (Taj)",      "Hospitality"),

    # ── CHEMICALS & SPECIALTY ────────────────────────────────────────────────
    ("SRF.NS",         "SRF",                      "Chemicals"),
    ("AAPL.NS",        "Aarti Industries",         "Chemicals"),
    ("NAVINFLUOR.NS",  "Navin Fluorine",           "Chemicals"),
    ("DEEPAKNTR.NS",   "Deepak Nitrite",           "Chemicals"),
    ("TATACHEM.NS",    "Tata Chemicals",           "Chemicals"),
    ("GNFC.NS",        "Gujarat Narmada Valley",   "Chemicals"),
    ("ATUL.NS",        "Atul",                     "Chemicals"),
    ("FINEORG.NS",     "Fine Organic Industries",  "Chemicals"),

    # ── DEFENCE & AEROSPACE ──────────────────────────────────────────────────
    ("HAL.NS",         "Hindustan Aeronautics",    "Defence"),
    ("BEL.NS",         "Bharat Electronics",       "Defence"),
    ("BHEL.NS",        "Bharat Heavy Electricals", "Defence"),
    ("BEML.NS",        "BEML",                     "Defence"),
    ("COCHINSHIP.NS",  "Cochin Shipyard",          "Defence"),
    ("MAZAGON.NS",     "Mazagon Dock Shipbuilders","Defence"),
    ("GRSE.NS",        "Garden Reach Shipbuilders","Defence"),

    # ── AGRI & FERTILIZERS ───────────────────────────────────────────────────
    ("COROMANDEL.NS",  "Coromandel International", "Agri"),
    ("UPL.NS",         "UPL",                      "Agri"),
    ("PIIND.NS",       "PI Industries",            "Agri"),
    ("RALLIS.NS",      "Rallis India",             "Agri"),
    ("NFL.NS",         "National Fertilizers",     "Agri"),
    ("CHAMBLFERT.NS",  "Chambal Fertilizers",      "Agri"),

    # ── TEXTILES & APPAREL ───────────────────────────────────────────────────
    ("RAYMOND.NS",     "Raymond",                  "Textile"),
    ("TRIDENT.NS",     "Trident",                  "Textile"),
    ("VARDHMAN.NS",    "Vardhman Textiles",        "Textile"),
    ("ARVIND.NS",      "Arvind",                   "Textile"),

    # ── LOGISTICS ────────────────────────────────────────────────────────────
    ("CONCOR.NS",      "Container Corp of India",  "Logistics"),
    ("BLUEDARTING.NS", "Blue Dart Express",        "Logistics"),
    ("DELHIVERY.NS",   "Delhivery",                "Logistics"),
    ("MAHLOG.NS",      "Mahindra Logistics",       "Logistics"),

    # ── INDICES (for reference) ───────────────────────────────────────────────
    ("^NSEI",          "NIFTY 50",                 "Index"),
    ("^NSEBANK",       "NIFTY Bank",               "Index"),
    ("^CNXIT",         "NIFTY IT",                 "Index"),
]

# Build a quick-lookup dict: yahoo_symbol → (display_name, sector)
STOCK_MAP = {sym: (name, sector) for sym, name, sector in NSE_STOCKS}

# All unique sectors
SECTORS = sorted(set(sector for _, _, sector in NSE_STOCKS))
