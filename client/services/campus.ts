import { calculateDistance } from "@/app/(student)/map";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Building = {
  name: string;
  location: Coordinates;
  front?: Coordinates;
  back?: Coordinates;
};

export class BuildingService {
  public static Buildings: Building[] = [
    {
      name: "Aerodynamics Laboratory",
      location: {
        latitude: 47.654176,
        longitude: -122.305426,
      },
    },
    {
      name: "Aerospace and Engineering Research Building",
      location: {
        latitude: 47.6553,
        longitude: -122.30583,
      },
    },
    {
      name: "Alder Hall",
      location: {
        latitude: 47.65546,
        longitude: -122.31419,
      },
    },
    {
      name: "Allen Library",
      location: {
        latitude: 47.65554,
        longitude: -122.30703,
      },
    },
    {
      name: "Anderson Hall",
      location: {
        latitude: 47.65174,
        longitude: -122.3076,
      },
    },
    {
      name: "Architecture Hall",
      location: {
        latitude: 47.65476785743224,
        longitude: -122.31079793813925,
      },
    },
    {
      name: "Art Building",
      location: {
        latitude: 47.65839,
        longitude: -122.30639,
      },
    },
    {
      name: "Atmospheric Sciences-Geophysics Building",
      location: {
        latitude: 47.65399,
        longitude: -122.30937,
      },
    },
    {
      name: "Bagley Hall",
      location: {
        latitude: 47.65348,
        longitude: -122.30884,
      },
    },
    {
      name: "Bank of America Executive Education Center",
      location: {
        latitude: 47.65954,
        longitude: -122.30775,
      },
    },
    {
      name: "Benjamin Hall Interdisciplinary Research Building",
      location: {
        latitude: 47.655263,
        longitude: -122.3214,
      },
    },
    {
      name: "Bill & Melinda Gates Center for Computer Science & Engineering",
      location: {
        latitude: 47.65297,
        longitude: -122.30512,
      },
    },
    {
      name: "Bloedel Hall",
      location: {
        latitude: 47.65128,
        longitude: -122.30765,
      },
    },
    {
      name: "Blakeley Village Building",
      location: {
        latitude: 47.66521,
        longitude: -122.29719,
      },
    },
    {
      name: "Bowman Building",
      location: {
        latitude: 47.66277,
        longitude: -122.29526,
      },
    },
    {
      name: "Brooklyn Trail Building",
      location: {
        latitude: 47.65465,
        longitude: -122.31477,
      },
    },
    {
      name: "Burke Memorial-Washington State Museum",
      location: {
        latitude: 47.66042,
        longitude: -122.31153,
      },
    },
    {
      name: "Cedar  Apartments ",
      location: {
        latitude: 47.65859,
        longitude: -122.31627,
      },
    },
    {
      name: "Chemistry Building (CHB)",
      location: {
        latitude: 47.65292,
        longitude: -122.30835,
      },
    },
    {
      name: "Chemistry Library Building (CHL)",
      location: {
        latitude: 47.65378892266391,
        longitude: -122.30999668906585,
      },
    },
    {
      name: "Child Learning & Care Center",
      location: {
        latitude: 47.6489,
        longitude: -122.3075,
      },
    },
    {
      name: "Clark Hall (CLK)",
      location: {
        latitude: 47.65766208767907,
        longitude: -122.30483765553268,
      },
    },
    {
      name: "Collegiana Hospitality House",
      location: {
        latitude: 47.6605,
        longitude: -122.3138,
      },
    },
    {
      name: "Communications Building (CMU)",
      location: {
        latitude: 47.6564,
        longitude: -122.3096,
      },
    },
    {
      name: "Condon Hall (CDH)",
      location: {
        latitude: 47.655,
        longitude: -122.3123,
      },
    },
    {
      name: "Conibear Shellhouse (CSH)",
      location: {
        latitude: 47.6517,
        longitude: -122.3051,
      },
    },
    {
      name: "Dempsey Hall (DEM)",
      location: {
        latitude: 47.6599,
        longitude: -122.308,
      },
    },
    {
      name: "Dempsey Indoor Center (IPF)",
      location: {
        latitude: 47.651,
        longitude: -122.301,
      },
    },
    {
      name: "Denny Hall (DEN)",
      location: {
        latitude: 47.65849324441406,
        longitude: -122.30882263356827,
      },
    },
    {
      name: "Douglas Research Conservatory (DRC)",
      location: {
        latitude: 47.653,
        longitude: -122.29,
      },
    },
    {
      name: "Eagleson Hall (EGL)",
      location: {
        latitude: 47.656,
        longitude: -122.312,
      },
    },
    {
      name: "Electrical and Computer Engineering Building (ECE)",
      location: {
        latitude: 47.6535,
        longitude: -122.3035,
      },
    },
    {
      name: "Elm Hall (ELM)",
      location: {
        latitude: 47.6565,
        longitude: -122.3135,
      },
    },
    {
      name: "Engineering Annex (EGA)",
      location: {
        latitude: 47.653,
        longitude: -122.3045,
      },
    },
    {
      name: "Engineering Library (ELB)",
      location: {
        latitude: 47.6535,
        longitude: -122.304,
      },
    },
    {
      name: "Ethnic Cultural Center Theatre (ICT)",
      location: {
        latitude: 47.656,
        longitude: -122.313,
      },
    },
    {
      name: "Faye G. Allen Center for the Visual Arts (AVA)",
      location: {
        latitude: 47.6565,
        longitude: -122.3115,
      },
    },
    {
      name: "Fialkow Biomedical Sciences Research Pavilion (K wing) (HSK)",
      location: {
        latitude: 47.6515,
        longitude: -122.309,
      },
    },
    {
      name: "Fisheries Teaching and Research Building (FTR)",
      location: {
        latitude: 47.651,
        longitude: -122.317,
      },
    },
    {
      name: "Fishery Sciences (FSH)",
      location: {
        latitude: 47.6515,
        longitude: -122.3165,
      },
    },
    {
      name: "Floyd and Delores Jones Playhouse (PHT)",
      location: {
        latitude: 47.658,
        longitude: -122.313,
      },
    },
    {
      name: "Fluke Hall (FLK)",
      location: {
        latitude: 47.653,
        longitude: -122.304,
      },
    },
    {
      name: "Founders Hall (FNDR)",
      location: {
        latitude: 47.6592,
        longitude: -122.3082,
      },
    },
    {
      name: "Gerberding Hall (GRB)",
      location: {
        latitude: 47.65525981617203,
        longitude: -122.3095360992912,
      },
    },
    {
      name: "Gould Hall (GLD)",
      location: {
        latitude: 47.656,
        longitude: -122.313,
      },
    },
    {
      name: "Gowen Hall (GWN)",
      location: {
        latitude: 47.6571,
        longitude: -122.3095,
      },
    },
    {
      name: "Graves Annex Building (GAB)",
      location: {
        latitude: 47.6512,
        longitude: -122.3038,
      },
    },
    {
      name: "Graves Hall (TGB)",
      location: {
        latitude: 47.651,
        longitude: -122.3035,
      },
    },
    {
      name: "Guggenheim Annex (GUA)",
      location: {
        latitude: 47.6533,
        longitude: -122.305,
      },
    },
    {
      name: "Guggenheim Hall (GUG)",
      location: {
        latitude: 47.6531,
        longitude: -122.3052,
      },
    },
    {
      name: "Guthrie Hall (GTH)",
      location: {
        latitude: 47.6555,
        longitude: -122.3125,
      },
    },
    {
      name: "Haggett Hall (HGT)",
      location: {
        latitude: 47.6578,
        longitude: -122.3039,
      },
    },
    {
      name: "Hall Health Center (HHC)",
      location: {
        latitude: 47.65617873341951,
        longitude: -122.30432295610464,
      },
    },
    {
      name: "Hans Rosling Center for Population Health (HRC)",
      location: {
        latitude: 47.6535,
        longitude: -122.3087,
      },
    },
    {
      name: "Hansee Hall (HNS)",
      location: {
        latitude: 47.66,
        longitude: -122.312,
      },
    },
    {
      name: "Harris Hydraulics Laboratory (HHL)",
      location: {
        latitude: 47.6538,
        longitude: -122.3083,
      },
    },
    {
      name: "Health Sciences Education Building (HSEB)",
      location: {
        latitude: 47.6505,
        longitude: -122.3095,
      },
    },
    {
      name: "Hec Edmundson Pavilion (EDP)",
      location: {
        latitude: 47.6502,
        longitude: -122.3044,
      },
    },
    {
      name: "Henderson Hall (HND)",
      location: {
        latitude: 47.6517,
        longitude: -122.3089,
      },
    },
    {
      name: "Henry Art Gallery (HAG)",
      location: {
        latitude: 47.6565,
        longitude: -122.31,
      },
    },
    {
      name: "Hitchcock Hall (HCK)",
      location: {
        latitude: 47.6532,
        longitude: -122.3085,
      },
    },
    {
      name: "Hutchinson Hall (HUT)",
      location: {
        latitude: 47.65961,
        longitude: -122.30662,
      },
    },
    {
      name: "Ethnic Cultural Theater (ICT)",
      location: {
        latitude: 47.65518,
        longitude: -122.31419,
      },
    },
    {
      name: "Intellectual House (INT)",
      location: {
        latitude: 47.6583,
        longitude: -122.30481,
      },
    },
    {
      name: "Intramural Activities Building (IMA)",
      location: {
        latitude: 47.65372,
        longitude: -122.30128,
      },
    },
    {
      name: "Isaacson Hall (ISA)",
      location: {
        latitude: 47.65788,
        longitude: -122.28996,
      },
    },
    {
      name: "John M. Wallace Hall (ACC)",
      location: {
        latitude: 47.65304,
        longitude: -122.31487,
      },
    },
    {
      name: "Johnson Hall (JHN)",
      location: {
        latitude: 47.65487,
        longitude: -122.30907,
      },
    },
    {
      name: "Kane Hall (KNE)",
      location: {
        latitude: 47.65658,
        longitude: -122.30919,
      },
    },
    {
      name: "Kincaid Hall (KIN)",
      location: {
        latitude: 47.65267,
        longitude: -122.31061,
      },
    },
    {
      name: "Lander Hall (LAN)",
      location: {
        latitude: 47.65566,
        longitude: -122.31502,
      },
    },
    {
      name: "Laurel Village (LAV)",
      location: {
        latitude: 47.65982,
        longitude: -122.29131,
      },
    },
    {
      name: "Lewis Hall (LEW)",
      location: {
        latitude: 47.65885,
        longitude: -122.30538,
      },
    },
    {
      name: "Life Sciences Building (LSB)",
      location: {
        latitude: 47.65207,
        longitude: -122.30969,
      },
    },
    {
      name: "Loew Hall (LOW)",
      location: {
        latitude: 47.65432,
        longitude: -122.30452,
      },
    },
    {
      name: "Madrona Hall (MDR)",
      location: {
        latitude: 47.66012,
        longitude: -122.30522,
      },
    },
    {
      name: "Magnuson Health Sciences Center A (HSA)",
      location: {
        latitude: 47.6505,
        longitude: -122.3095,
      },
    },
    {
      name: "Magnuson Health Sciences Center B (HSB)",
      location: {
        latitude: 47.6505,
        longitude: -122.3095,
      },
    },
    {
      name: "Magnuson Health Sciences Center C (HSC)",
      location: {
        latitude: 47.6505,
        longitude: -122.3095,
      },
    },
    {
      name: "Magnuson Health Sciences Center D (HSD)",
      location: {
        latitude: 47.6505,
        longitude: -122.3095,
      },
    },
    {
      name: "Magnuson Health Sciences Center E (HSE)",
      location: {
        latitude: 47.6505,
        longitude: -122.3095,
      },
    },
    {
      name: "Magnuson Health Sciences Center F (HSF)",
      location: {
        latitude: 47.6505,
        longitude: -122.3095,
      },
    },
    {
      name: "Magnuson Health Sciences Center G (HSG)",
      location: {
        latitude: 47.6505,
        longitude: -122.3095,
      },
    },
    {
      name: "Magnuson Health Sciences Center H (HSH)",
      location: {
        latitude: 47.6505,
        longitude: -122.3095,
      },
    },
    {
      name: "Magnuson Health Sciences Center I (HSI)",
      location: {
        latitude: 47.6505,
        longitude: -122.3095,
      },
    },
    {
      name: "Magnuson Health Sciences Center J (HSJ)",
      location: {
        latitude: 47.6505,
        longitude: -122.3095,
      },
    },
    {
      name: "Magnuson Health Sciences Center RR (HSRR)",
      location: {
        latitude: 47.6505,
        longitude: -122.3095,
      },
    },
    {
      name: "Magnuson Health Sciences Center T (HST)",
      location: {
        latitude: 47.6505,
        longitude: -122.3095,
      },
    },
    {
      name: "Marine Sciences Building (MSB)",
      location: {
        latitude: 47.64989,
        longitude: -122.31292,
      },
    },
    {
      name: "Marine Studies Building (MAR)",
      location: {
        latitude: 47.65244,
        longitude: -122.31498,
      },
    },
    {
      name: "Mary Gates Hall (MGH)",
      location: {
        latitude: 47.655,
        longitude: -122.3078,
      },
    },
    {
      name: "McCarty Hall (MCC)",
      location: {
        latitude: 47.66074,
        longitude: -122.30482,
      },
    },
    {
      name: "Maple Hall (MAH)",
      location: {
        latitude: 47.65568,
        longitude: -122.31618,
      },
    },
    {
      name: "McMahon Hall (MCM)",
      location: {
        latitude: 47.6582,
        longitude: -122.30373,
      },
    },
    {
      name: "'Meany Hall (MNY)",
      location: {
        latitude: 47.65557,
        longitude: -122.31058,
      },
    },
    {
      name: "Department of Mechanical Engineering",
      location: {
        latitude: 47.65345,
        longitude: -122.3049,
      },
    },
    {
      name: "Mercer Court (MRC)",
      location: {
        latitude: 47.65442,
        longitude: -122.31781,
      },
    },
    {
      name: "Mary Gates Hall",
      location: {
        latitude: 47.657212074889294,
        longitude: -122.30487145010869,
      },
      front: {
        latitude: 42.5432,
        longitude: -119.332,
      },
      back: {
        latitude: 42.4339,
        longitude: -119.332,
      },
    },
    {
      name: "Odegaard Library",
      location: {
        latitude: 47.65634961334056,
        longitude: -122.30997957702249,
      },
      front: {
        latitude: 47.65634961334056,
        longitude: -122.30997957702249,
      },
      back: {
        latitude: 47.65659357022611,
        longitude: -122.31088334118108,
      },
    },
    {
      name: "Husky Union Building (HUB)",
      location: {
        latitude: 47.65557006903249,
        longitude: -122.30509195160619,
      },
    },
    {
      name: "Merrill Hall (NMH)",
      location: {
        latitude: 47.65814969059562,
        longitude: -122.290368498205,
      },
    },
    {
      name: "Miller Hall (MLR)",
      location: {
        latitude: 47.657807962873434,
        longitude: -122.306026449184,
      },
    },
    {
      name: "Molecular Engineering & Sciences Building (MOL/NAN)",
      location: {
        latitude: 47.65453487152259,
        longitude: -122.31002169142221,
      },
    },
    {
      name: "More Hall (MOR)",
      location: {
        latitude: 47.65319404929506,
        longitude: -122.30458384918728,
      },
    },
    {
      name: "Mueller Hall (MUE)",
      location: {
        latitude: 47.65288363537156,
        longitude: -122.30492130315712,
      },
    },
    {
      name: "Music Building (MUS)",
      location: {
        latitude: 47.658099611452734,
        longitude: -122.30581029521397,
      },
    },
    {
      name: "Nordheim Court  (NC)",
      location: {
        latitude: 47.666236179345134,
        longitude: -122.30069903329965,
      },
    },
    {
      name: "North Physics Laboratory Cyclotron Shop (NPS)",
      location: {
        latitude: 47.65995968002903,
        longitude: -122.30282241055644,
      },
    },
    {
      name: "Oak Hall (OAK)",
      location: {
        latitude: 47.66012915214022,
        longitude: -122.30548676399066,
      },
    },
    {
      name: "Ocean Research Building 2 (OR2)",
      location: {
        latitude: 47.652787864565134,
        longitude: -122.31411121056114,
      },
    },
    {
      name: "Ocean Sciences Building (OCN)",
      location: {
        latitude: 47.651746001238045,
        longitude: -122.31252329521845,
      },
    },
    {
      name: "Oceanography Buildings (OCE)",
      location: {
        latitude: 47.64980328360169,
        longitude: -122.3105142259068,
      },
    },
    {
      name: "PACCAR Hall (PCAR)",
      location: {
        latitude: 47.660418312890464,
        longitude: -122.30871273383909,
      },
    },
    {
      name: "Padelford Hall (PDL)",
      location: {
        latitude: 47.65775470142478,
        longitude: -122.30410819521447,
      },
    },
    {
      name: "Parrington Hall (PAR)",
      location: {
        latitude: 47.657941449076496,
        longitude: -122.31028425658796,
      },
    },
    {
      name: "Paul G. Allen Center for Computer Science & Engineering (CSE)",
      location: {
        latitude: 47.65384968984444,
        longitude: -122.30569544124735,
      },
    },
    {
      name: "Pavilion Pool (PVP)",
      location: {
        latitude: 47.6524032134732,
        longitude: -122.30117035659183,
      },
    },
    {
      name: "Physics-Astronomy Auditorium (PAA)",
      location: {
        latitude: 47.65330784074122,
        longitude: -122.31079073682409,
      },
    },
    {
      name: "Physics-Astronomy Building (PAB)",
      location: {
        latitude: 47.65428843475653,
        longitude: -122.3109326184996,
      },
    },
    {
      name: "Physics-Astronomy Tower (PAC)",
      location: {
        latitude: 47.653794015152364,
        longitude: -122.31209527139897,
      },
    },
    {
      name: "Plant Operations Annexes (POA)",
      location: {
        latitude: 47.654536517615334,
        longitude: -122.30336596445449,
      },
    },
    {
      name: "Plant Operations/Services Buildings (POB)",
      location: {
        latitude: 47.65474110810627,
        longitude: -122.30374688097734,
      },
    },
    {
      name: "Poplar Hall (POP)",
      location: {
        latitude: 47.656533620151336,
        longitude: -122.31397478285919,
      },
    },
    {
      name: "Portage Bay Building (PBB)",
      location: {
        latitude: 47.64937905622626,
        longitude: -122.30913513382093,
      },
    },
    {
      name: "Power Plant (PWR)",
      location: {
        latitude: 47.654358601060174,
        longitude: -122.30352751056017,
      },
    },
    {
      name: "Publications Services Building (PSV)",
      location: {
        latitude: 47.655854984494454,
        longitude: -122.32038615658944,
      },
    },
    {
      name: "Purchasing and Accounting Building (PCH)",
      location: {
        latitude: 47.654683450440395,
        longitude: -122.31346795217506,
      },
    },
    {
      name: "Raitt Hall (RAI)",
      location: {
        latitude: 47.65859027760579,
        longitude: -122.3069384338401,
      },
    },
    {
      name: "Roberts Hall (ROB)",
      location: {
        latitude: 47.65275755509363,
        longitude: -122.30519528727855,
      },
    },
    {
      name: "Samuel E. Kelly Ethnic Cultural Center (ECC)",
      location: {
        latitude: 47.6554992435552,
        longitude: -122.31512736399365,
      },
    },
    {
      name: "Savery Hall (SAV)",
      location: {
        latitude: 47.65748901550832,
        longitude: -122.30843475658817,
      },
    },
    {
      name: "Schmitz Hall (SMZ)",
      location: {
        latitude: 47.65738062000494,
        longitude: -122.31230370315413,
      },
    },
    {
      name: "Sieg Hall (SIG)",
      location: {
        latitude: 47.655466688793155,
        longitude: -122.3061786338422,
      },
    },
    {
      name: "Smith Hall (SMI)",
      location: {
        latitude: 47.65683703988756,
        longitude: -122.30754965658868,
      },
    },
    {
      name: "Social Work/Speech and Hearing Sciences Building (SWS)",
      location: {
        latitude: 47.65777627579022,
        longitude: -122.31221046452751,
      },
    },
    {
      name: "South Campus Center (SOCC)",
      location: {
        latitude: 47.649633038660625,
        longitude: -122.31082977608236,
      },
    },
    {
      name: "Husky Stadium",
      location: {
        latitude: 47.65106889764651,
        longitude: -122.30182471796667,
      },
    },
    {
      name: "Stevens Court (SCA)",
      location: {
        latitude: 47.65529315235987,
        longitude: -122.31641061796378,
      },
    },
    {
      name: "Suzzallo Library (SUZ)",
      location: {
        latitude: 47.656232251958706,
        longitude: -122.307971487276,
      },
    },
    {
      name: "Terry Hall (TEH)",
      location: {
        latitude: 47.65629245142558,
        longitude: -122.31698785658907,
      },
    },
    {
      name: "Theodor Jacobsen Observatory (OBS)",
      location: {
        latitude: 47.661098744278554,
        longitude: -122.30931807192934,
      },
    },
    {
      name: "Thomson Hall (THO)",
      location: {
        latitude: 47.65733333405035,
        longitude: -122.3059066179624,
      },
    },
    {
      name: "Transportation Services Building (TSB)",
      location: {
        latitude: 47.657014271660294,
        longitude: -122.31357819521486,
      },
    },
    {
      name: "University District Building (UDB)",
      location: {
        latitude: 47.66176794366154,
        longitude: -122.31616701055518,
      },
    },
    {
      name: "Urban Horticulture Field House (UHF)",
      location: {
        latitude: 47.65697518480286,
        longitude: -122.28882870195274,
      },
    },
    {
      name: "UW Medical Center",
      location: {
        latitude: 47.649524836354146,
        longitude: -122.3065380491895,
      },
    },
    {
      name: "UW Police Department (UWPD)",
      location: {
        latitude: 47.65481014108997,
        longitude: -122.31198985712525,
      },
    },
    {
      name: "UW Tower Buildings (UWT)",
      location: {
        latitude: 47.66100647916501,
        longitude: -122.31474117192913,
      },
    },
    {
      name: "Waterfront Activities Center (WAC)",
      location: {
        latitude: 47.649192269278025,
        longitude: -122.3000729026244,
      },
    },
    {
      name: "West Campus Utility Plant (WCUP)",
      location: {
        latitude: 47.653934789808865,
        longitude: -122.31295836452982,
      },
    },
    {
      name: "Wilcox Hall (WIL)",
      location: {
        latitude: 47.65225045950721,
        longitude: -122.30451352590491,
      },
    },
    {
      name: "William H. Gates Hall (LAW)",
      location: {
        latitude: 47.65955749149573,
        longitude: -122.31087157193016,
      },
    },
    {
      name: "Willow Hall (WLW)",
      location: {
        latitude: 47.66048043806377,
        longitude: -122.3047698793338,
      },
    },
    {
      name: "Wilson Annex (WLA)",
      location: {
        latitude: 47.65179525332432,
        longitude: -122.30498709521834,
      },
    },
    {
      name: "Wilson Ceramic Laboratory (WCL)",
      location: {
        latitude: 47.65255161345785,
        longitude: -122.30515204865256,
      },
    },
    {
      name: "Winkenwerder Forest Sciences Laboratory (WFS)",
      location: {
        latitude: 47.6518032532712,
        longitude: -122.30685782590521,
      },
    },
  ];

  static getBuildingCoordinates(buildingName: string): Coordinates {
    const building = BuildingService.Buildings.find(
      (building) => building.name === buildingName
    );
    if (!building) {
      throw new Error(`Building ${buildingName} not found`);
    }
    return building.location;
  }

  static getBuildingFrontCoordinates(buildingName: string): Coordinates {
    const building = BuildingService.Buildings.find(
      (building) => building.name === buildingName
    );
    if (!building) {
      throw new Error(`Building ${buildingName} not found`);
    } else {
      if (!building.front) {
        throw new Error(`Building ${buildingName} does not have a front`);
      }
    }
    return building.front;
  }

  static getBuildingBackCoordinates(buildingName: string): Coordinates {
    const building = BuildingService.Buildings.find(
      (building) => building.name === buildingName
    );
    if (!building) {
      throw new Error(`Building ${buildingName} not found`);
    } else {
      if (!building.back) {
        throw new Error(`Building ${buildingName} does not have a back`);
      }
    }
    return building.back;
  }

  static closestBuilding(coord: {
    latitude: number;
    longitude: number;
  }): Building | null {
    const zone: Building[] = BuildingService.Buildings.filter((building) => {
      // Check if the coordinates are within 0.002 degrees of the building's location
      return (
        Math.abs(coord.latitude - building.location.latitude) < 0.002 ||
        Math.abs(coord.longitude - building.location.longitude) < 0.002
      );
    });

    if (zone.length > 0) {
      return zone.reduce((prev, curr) => {
        // If no previous building, return the current one
        if (!prev) return curr;
        // Else, find the building closest to the coordinates
        const prevDistance = calculateDistance(coord, prev.location);
        const currDistance = calculateDistance(coord, curr.location);
        return prevDistance < currDistance ? prev : curr;
      });
    } else {
      return null;
    }
  }

  static closestBuildingEntrance(
    closestBuilding: string,
    coord: {
      latitude: number;
      longitude: number;
    }
  ): "front" | "back" | null {
    // find the closest building
    const building = BuildingService.Buildings.find(
      (building) => building.name === closestBuilding
    );
    if (!building) {
      return null;
    }
    const options: {
      description: "front" | "back" | null;
      coord: Coordinates;
      distance: number;
    }[] = [{ description: null, coord: building.location, distance: 0 }];
    if (building.front) {
      options.push({
        description: "front",
        coord: building.front,
        distance: 0,
      });
    }
    if (building.back) {
      options.push({ description: "back", coord: building.back, distance: 0 });
    }

    if (options.length == 1) {
      return null;
    }

    options.forEach((option) => {
      option.distance = calculateDistance(coord, option.coord);
    });

    // reduce the options to the closest one
    const closestOption = options.reduce((prev, curr) => {
      if (!prev) return curr;
      // Else, find the building closest to the coordinates
      const prevDistance = prev.distance;
      const currDistance = curr.distance;
      return prevDistance < currDistance ? prev : curr;
    });
    return closestOption.description;
  }

  static getClosestBuildingEntranceCoordinates = (
    closestBuilding: string,
    coord: {
      latitude: number;
      longitude: number;
    }
  ): Coordinates => {
    const building = BuildingService.Buildings.find(
      (building) => building.name === closestBuilding
    );
    if (!building) {
      throw new Error(`Building ${closestBuilding} not found`);
    }

    const entrance = BuildingService.closestBuildingEntrance(
      closestBuilding,
      coord
    );
    console.log("The closest entrance:", entrance ? entrance : "generic");
    if (!entrance) {
      return building.location;
    }
    if (entrance == "front" && building.front) {
      return building.front;
    } else if (entrance == "back" && building.back) {
      return building.back;
    }
    // If no entrance is found, return the building's location
    return building.location;
  };

  static topThreeClosestBuildings(coord: {
    latitude: number;
    longitude: number;
  }): ComparableBuilding[] | null {
    const comparableBuildings: ComparableBuilding[] = [];
    BuildingService.Buildings.forEach((building) => {
      const distance = calculateDistance(coord, building.location);
      const walkDuration = Math.round(distance / 1.4); // Assuming an average walking speed of 1.4 m/s
      comparableBuildings.push({ building, distance, walkDuration });
    });

    // Sort the buildings by distance
    comparableBuildings.sort(compareBuildings);
    return comparableBuildings.slice(0, 3);
  }
}

export type ComparableBuilding = {
  building: Building;
  distance: number;
  walkDuration: number;
};

/**
 * Compare two buildings based on their distance from a given point.
 * @param a - The first building to compare.
 * @param b - The second building to compare.
 * @returns A negative number if a is closer, a positive number if b is closer, and 0 if they are equidistant.
 */
export function compareBuildings(
  a: ComparableBuilding,
  b: ComparableBuilding
): number {
  return a.distance - b.distance;
}

export function getBuildingNames(): string[] {
  return BuildingService.Buildings.map((b) => b.name);
}
