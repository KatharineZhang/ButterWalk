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

// Helper type to help calculate closest buildings
export type ComparableBuilding = {
  building: Building;
  distance: number;
  walkDuration: number;
};

export class BuildingService {
  public static Buildings: Building[] = [
    {
      name: "Aerodynamics Laboratory",
      location: {
        latitude: 47.654145909853206,
        longitude: -122.3054656109872,
      },
    },
    {
      name: "Aerospace and Engineering Research Building",
      location: {
        latitude: 47.653996,
        longitude: -122.306079,
      },
    },
    {
      name: "Alder Hall",
      location: {
        latitude: 47.655896,
        longitude: -122.314116,
      },
    },
    {
      name: "Allen Library",
      location: {
        latitude: 47.655743735011406,
        longitude: -122.30779774129037,
      },
    },
    {
      name: "Anderson Hall",
      location: {
        latitude: 47.651856037467894,
        longitude: -122.30760534579424,
      },
    },
    {
      name: "Architecture Hall",
      location: {
        latitude: 47.65457211267626,
        longitude: -122.31075198480362,
      },
    },
    {
      name: "Art Building",
      location: {
        latitude: 47.658581,
        longitude: -122.306717,
      },
    },
    {
      name: "Atmospheric Sciences-Geophysics Building",
      location: {
        latitude: 47.65389417867651,
        longitude: -122.30947597721486,
      },
    },
    {
      name: "Bagley Hall",
      location: {
        latitude: 47.6529574242432,
        longitude: -122.30889381676606,
      },
    },
    {
      name: "Bank of America Executive Education Center",
      location: {
        latitude: 47.65966170733686,
        longitude: -122.30777796897307,
      },
    },
    {
      name: "Benjamin Hall Interdisciplinary Research Building",
      location: {
        latitude: 47.65548547484714,
        longitude: -122.32102136893216,
      },
    },
    {
      name: "Bill & Melinda Gates Center for Computer Science & Engineering",
      location: {
        latitude: 47.653009750062196,
        longitude: -122.30484320543665,
      },
    },
    {
      name: "Bloedel Hall",
      location: {
        latitude: 47.65146984203419,
        longitude: -122.30817694242195,
      },
    },
    {
      name: "Blakeley Village Building",
      location: {
        latitude: 47.665072351997985,
        longitude: -122.29712971982856,
      },
    },
    {
      name: "Brooklyn Trail Building",
      location: {
        latitude: 47.65470863485668,
        longitude: -122.31461718339109,
      },
    },
    {
      name: "Burke Memorial-Washington State Museum",
      location: {
        latitude: 47.66041816827474,
        longitude: -122.3112187955797,
      },
    },
    {
      name: "Cedar  Apartments",
      location: {
        latitude: 47.65699243504848,
        longitude: -122.31574245566567,
      },
    },
    {
      name: "Chemistry Building (CHB)",
      location: {
        latitude: 47.65299925378551,
        longitude: -122.30884929507398,
      },
    },
    {
      name: "Chemistry Library Building (CHL)",
      location: {
        latitude: 47.65368308933987,
        longitude: -122.3096854254018,
      },
    },
    {
      name: "Clark Hall (CLK)",
      location: {
        latitude: 47.65771740755596,
        longitude: -122.30500476853422,
      },
    },
    {
      name: "Communications Building (CMU)",
      location: {
        latitude: 47.65707039505502,
        longitude: -122.30494526608224,
      },
    },
    {
      name: "Condon Hall (CDH)",
      location: {
        latitude: 47.656396052735104,
        longitude: -122.31577899695029,
      },
    },
    {
      name: "Conibear Shellhouse (CSH)",
      location: {
        latitude: 47.65307776703236,
        longitude: -122.29979157657776,
      },
    },
    {
      name: "Central Plaza Garage C1",
      location: {
        latitude: 47.655001739100825,
        longitude: -122.3099611359588,
      },
    },
    {
      name: "Central Plaza Garage C2",
      location: {
        latitude: 47.655001739100825,
        longitude: -122.3099611359588,
      },
    },
    {
      name: "Central Plaza Garage C3",
      location: {
        latitude: 47.655001739100825,
        longitude: -122.3099611359588,
      },
    },
    {
      name: "Central Plaza Garage C4",
      location: {
        latitude: 47.655001739100825,
        longitude: -122.3099611359588,
      },
    },
    {
      name: "Central Plaza Garage C5",
      location: {
        latitude: 47.655001739100825,
        longitude: -122.3099611359588,
      },
    },
    {
      name: "Central Plaza Garage C6",
      location: {
        latitude: 47.655001739100825,
        longitude: -122.3099611359588,
      },
    },
    {
      name: "Dempsey Hall (DEM)",
      location: {
        latitude: 47.65937139553685,
        longitude: -122.30736045649674,
      },
    },
    {
      name: "Dempsey Indoor Center",
      location: {
        latitude: 47.651378074574836,
        longitude: -122.29898023678969,
      },
    },
    {
      name: "Denny Hall (DEN)",
      location: {
        latitude: 47.658707318076885,
        longitude: -122.30911123861098,
      },
    },
    {
      name: "Douglas Research Conservatory (DRC)",
      location: {
        latitude: 47.65786712411186,
        longitude: -122.28884803921505,
      },
    },
    {
      name: "Eagleson Hall (EGL)",
      location: {
        latitude: 47.65808548949365,
        longitude: -122.31229082712574,
      },
    },
    {
      name: "Electrical and Computer Engineering Building (ECE)",
      location: {
        latitude: 47.65377972206346,
        longitude: -122.30636014236474,
      },
    },
    {
      name: "Elm Hall (ELM)",
      location: {
        latitude: 47.65651821244692,
        longitude: -122.31503308731979,
      },
    },
    {
      name: "Engineering Annex (EGA)",
      location: {
        latitude: 47.65373982627239,
        longitude: -122.3044758978453,
      },
    },
    {
      name: "Engineering Library (ELB)",
      location: {
        latitude: 47.654583971665964,
        longitude: -122.30455550041813,
      },
    },
    {
      name: "Ethnic Cultural Center Theatre (ECT)",
      location: {
        latitude: 47.65511531631396,
        longitude: -122.31434290692155,
      },
    },
    {
      name: "Faye G. Allen Center for the Visual Arts (AVA)",
      location: {
        latitude: 47.65620739893473,
        longitude: -122.3117701854371,
      },
    },
    {
      name: "Fialkow Biomedical Sciences Research Pavilion (K wing) (HSK)",
      location: {
        latitude: 47.651217928552065,
        longitude: -122.31217213574062,
      },
    },
    {
      name: "Fisheries Teaching and Research Building (FTR)",
      location: {
        latitude: 47.65240941188302,
        longitude: -122.31565060165332,
      },
    },
    {
      name: "Fishery Sciences (FSH)",
      location: {
        latitude: 47.65247943745099,
        longitude: -122.31563067892712,
      },
    },
    {
      name: "Floyd and Delores Jones Playhouse (PHT)",
      location: {
        latitude: 47.65677398064284,
        longitude: -122.31336110059962,
      },
    },
    {
      name: "Fluke Hall (FLK)",
      location: {
        latitude: 47.65606697944179,
        longitude: -122.30287824915509,
      },
    },
    {
      name: "Founders Hall (FNDR)",
      location: {
        latitude: 47.6591337904406,
        longitude: -122.30717802152388,
      },
    },
    {
      name: "Gerberding Hall (GRB)",
      location: {
        latitude: 47.655310863180524,
        longitude: -122.30969191774132,
      },
    },
    {
      name: "Gould Hall (GLD)",
      location: {
        latitude: 47.655254362845795,
        longitude: -122.31274309969263,
      },
    },
    {
      name: "Gowen Hall (GWN)",
      location: {
        latitude: 47.656247,
        longitude: -122.307443,
      },
    },
    {
      name: "Graves Annex Building (GAB)",
      location: {
        latitude: 47.652342799958696,
        longitude: -122.30069871785277,
      },
    },
    {
      name: "Graves Hall (TGB)",
      location: {
        latitude: 47.65286392858252,
        longitude: -122.30254796077995,
      },
    },
    {
      name: "Guggenheim Annex (GUA)",
      location: {
        latitude: 47.65457871933468,
        longitude: -122.30640764030558,
      },
    },
    {
      name: "Guggenheim Hall (GUG)",
      location: {
        latitude: 47.65411634644492,
        longitude: -122.30637718121088,
      },
    },
    {
      name: "Guthrie Hall (GTH)",
      location: {
        latitude: 47.65322385230462,
        longitude: -122.31351835075509,
      },
    },
    /*
    {
      
      name: "Haggett Hall (HGT)",
      location: {
        latitude: 47.65925859883902,
        longitude: -122.30375259352043,
      },
    },
    */
    {
      name: "Hall Health Center (HHC)",
      location: {
        latitude: 47.65619126112445,
        longitude: -122.30430676244933,
      },
    },
    {
      name: "Hans Rosling Center for Population Health (HRC)",
      location: {
        latitude: 47.654788570813494,
        longitude: -122.31189903381835,
      },
    },
    {
      name: "Hansee Hall (HNS)",
      location: {
        latitude: 47.660849376568244,
        longitude: -122.30652383310903,
      },
    },
    {
      name: "Harris Hydraulics Laboratory (HHL)",
      location: {
        latitude: 47.64993372067876,
        longitude: -122.31156461347433,
      },
    },
    {
      name: "Health Sciences Education Building (HSEB)",
      location: {
        latitude: 47.65168591587304,
        longitude: -122.31051494535252,
      },
    },
    {
      name: "Alaska Airlines Arena",
      location: {
        latitude: 47.65219091187172,
        longitude: -122.30298917176218,
      },
    },
    {
      name: "Henderson Hall (HND)",
      location: {
        latitude: 47.655214666731375,
        longitude: -122.31731739262281,
      },
    },
    {
      name: "Henry Art Gallery (HAG)",
      location: {
        latitude: 47.65654755104911,
        longitude: -122.31158360117163,
      },
    },
    {
      name: "Hitchcock Hall (HCK)",
      location: {
        latitude: 47.651888461875366,
        longitude: -122.31152823186072,
      },
    },
    {
      name: "Hutchinson Hall (HUT)",
      location: {
        latitude: 47.65960945800002,
        longitude: -122.30669754453278,
      },
    },
    {
      name: "Intellectual House (INT)",
      location: {
        latitude: 47.658440551281906,
        longitude: -122.3047065933891,
      },
    },
    {
      name: "Intramural Activities Building (IMA)",
      location: {
        latitude: 47.65364154337595,
        longitude: -122.30158796924562,
      },
    },
    {
      name: "Isaacson Hall (ISA)",
      location: {
        latitude: 47.657976549574144,
        longitude: -122.2899435864212,
      },
    },
    {
      name: "John M. Wallace Hall (ACC)",
      location: {
        latitude: 47.653044278320834,
        longitude: -122.31469682590821,
      },
    },
    {
      name: "Johnson Hall (JHN)",
      location: {
        latitude: 47.654899,
        longitude: -122.309003,
      },
    },
    {
      name: "Kane Hall (KNE)",
      location: {
        latitude: 47.65691551950023,
        longitude: -122.30903347347314,
      },
    },
    {
      name: "Kincaid Hall (KIN)",
      location: {
        latitude: 47.65254150860671,
        longitude: -122.31090811972389,
      },
    },
    {
      name: "Lander Hall (LAN)",
      location: {
        latitude: 47.655982627641194,
        longitude: -122.315010993999,
      },
    },
    {
      name: "Laurel Village (LAV)",
      location: {
        latitude: 47.66015074613112,
        longitude: -122.2912697237839,
      },
    },
    {
      name: "Lewis Hall (LEW)",
      location: {
        latitude: 47.65888042909602,
        longitude: -122.30530053000759,
      },
    },
    {
      name: "Life Sciences Building (LSB)",
      location: {
        latitude: 47.6523717101398,
        longitude: -122.30973172529738,
      },
    },
    {
      name: "Loew Hall (LOW)",
      location: {
        latitude: 47.65421743619004,
        longitude: -122.30456964720499,
      },
    },
    {
      name: "Madrona Hall (MDR)",
      location: {
        latitude: 47.660240320482835,
        longitude: -122.30532402669247,
      },
    },
    {
      name: "Magnuson Health Sciences Center A (HSA)",
      location: {
        latitude: 47.6502648298363,
        longitude: -122.3081718600694,
      },
    },
    {
      name: "Magnuson Health Sciences Center B (HSB)",
      location: {
        latitude: 47.64973556725395,
        longitude: -122.30925193383219,
      },
    },
    {
      name: "Magnuson Health Sciences Center D (HSD)",
      location: {
        latitude: 47.650149588451455,
        longitude: -122.3093451472053,
      },
    },
    {
      name: "Magnuson Health Sciences Center E (HSE)",
      location: {
        latitude: 47.65063107791709,
        longitude: -122.30939585723543,
      },
    },
    {
      name: "Magnuson Health Sciences Center F (HSF)",
      location: {
        latitude: 47.65023705383899,
        longitude: -122.31015970676567,
      },
    },
    {
      name: "Magnuson Health Sciences Center H (HSH)",
      location: {
        latitude: 47.65054795253484,
        longitude: -122.3107626112857,
      },
    },

    {
      name: "Magnuson Health Sciences Center T (HST)",
      location: {
        latitude: 47.651088578683364,
        longitude: -122.30921479604416,
      },
    },
    {
      name: "Marine Sciences Building (MSB)",
      location: {
        latitude: 47.64980432598877,
        longitude: -122.31236410636598,
      },
    },
    {
      name: "Marine Studies Building (MAR)",
      location: {
        latitude: 47.652371518592716,
        longitude: -122.31474129113369,
      },
    },
    {
      name: "Mary Gates Hall (MGH)",
      location: {
        latitude: 47.655154727533876,
        longitude: -122.30756349195849,
      },
    },
    {
      name: "McCarty Hall (MCC)",
      location: {
        latitude: 47.660447301948984,
        longitude: -122.30489067545548,
      },
    },
    {
      name: "Maple Hall (MAH)",
      location: {
        latitude: 47.65597239975355,
        longitude: -122.31499908990595,
      },
    },
    {
      name: "McMahon Hall (MCM)",
      location: {
        latitude: 47.65822077542516,
        longitude: -122.3040276699889,
      },
    },
    {
      name: "Meany Hall (MNY)",
      location: {
        latitude: 47.65573381723382,
        longitude: -122.31064092601596,
      },
    },
    {
      name: "Department of Mechanical Engineering",
      location: {
        latitude: 47.65341721119134,
        longitude: -122.3049910247328,
      },
    },
    {
      name: "Mercer Court (MRC)",
      location: {
        latitude: 47.65481930770117,
        longitude: -122.31760013031219,
      },
    },
    {
      name: "Odegaard Library",
      location: {
        latitude: 47.65675486360317,
        longitude: -122.30994734434229,
      },
    },
    {
      name: "Merrill Hall (NMH)",
      location: {
        latitude: 47.657901622943754,
        longitude: -122.29068717491369,
      },
    },
    {
      name: "Miller Hall (MLR)",
      location: {
        latitude: 47.657039,
        longitude: -122.306337,
      },
    },
    {
      name: "Molecular Engineering & Sciences Building (MOL/NAN)",
      location: {
        latitude: 47.65444121894472,
        longitude: -122.3101735533603,
      },
    },
    {
      name: "More Hall (MOR)",
      location: {
        latitude: 47.65242342009211,
        longitude: -122.30447581941021,
      },
    },
    {
      name: "Mueller Hall (MUE)",
      location: {
        latitude: 47.65219748028658,
        longitude: -122.30543624905793,
      },
    },
    {
      name: "Music Building (MUS)",
      location: {
        latitude: 47.65740254119366,
        longitude: -122.3054602049049,
      },
    },
    {
      name: "North Physics Laboratory Cyclotron Shop (NPS)",
      location: {
        latitude: 47.65913204335531,
        longitude: -122.30309518803602,
      },
    },
    {
      name: "Oak Hall (OAK)",
      location: {
        latitude: 47.65911326385438,
        longitude: -122.30591783948768,
      },
    },
    {
      name: "Ocean Research Building 2 (OR2)",
      location: {
        latitude: 47.65239306627112,
        longitude: -122.31424509657032,
      },
    },
    {
      name: "Ocean Sciences Building (OCN)",
      location: {
        latitude: 47.65104957854451,
        longitude: -122.31249261298812,
      },
    },
    {
      name: "Oceanography Buildings (OCE)",
      location: {
        latitude: 47.649095404962715,
        longitude: -122.31061074720535,
      },
    },
    {
      name: "PACCAR Hall (PCAR)",
      location: {
        latitude: 47.65936371854245,
        longitude: -122.30887362815483,
      },
    },
    {
      name: "Padelford Hall (PDL)",
      location: {
        latitude: 47.65658543847523,
        longitude: -122.30418194500425,
      },
    },
    {
      name: "Parrington Hall (PAR)",
      location: {
        latitude: 47.657414344538154,
        longitude: -122.31032713371324,
      },
    },
    {
      name: "Paul G. Allen Center for Computer Science & Engineering (CSE)",
      location: {
        latitude: 47.65346513429678,
        longitude: -122.30552389128307,
      },
    },
    {
      name: "Hec Edumundson Pavilion Pool (PVP)",
      location: {
        latitude: 47.651918452751005,
        longitude: -122.30099637030055,
      },
    },
    {
      name: "Physics-Astronomy Auditorium (PAA)",
      location: {
        latitude: 47.652977041656236,
        longitude: -122.31074331308147,
      },
    },
    {
      name: "Physics-Astronomy Building (PAB)",
      location: {
        latitude: 47.653311228500186,
        longitude: -122.31176901721835,
      },
    },
    {
      name: "Plant Operations Annexes (POA)",
      location: {
        latitude: 47.65442886793665,
        longitude: -122.30329058719053,
      },
    },
    {
      name: "Plant Services Buildings (POB)",
      location: {
        latitude: 47.654239082915666,
        longitude: -122.30390968611943,
      },
    },
    {
      name: "Poplar Hall (POP)",
      location: {
        latitude: 47.65640351120548,
        longitude: -122.31400697233558,
      },
    },
    {
      name: "Portage Bay Building (PBB)",
      location: {
        latitude: 47.64886376128413,
        longitude: -122.31014023975351,
      },
    },
    {
      name: "Power Plant (PWR)",
      location: {
        latitude: 47.653627890482085,
        longitude: -122.30397652511006,
      },
    },
    {
      name: "Publications Services Building (PSV)",
      location: {
        latitude: 47.65517217934046,
        longitude: -122.32038702603559,
      },
    },
    {
      name: "Purchasing and Accounting Building (PCH)",
      location: {
        latitude: 47.65463439116483,
        longitude: -122.31372418467929,
      },
    },
    {
      name: "Raitt Hall (RAI)",
      location: {
        latitude: 47.65787529165982,
        longitude: -122.3072924472048,
      },
    },
    {
      name: "Roberts Hall (ROB)",
      location: {
        latitude: 47.65193408016059,
        longitude: -122.30517379211042,
      },
    },
    {
      name: "Samuel E. Kelly Ethnic Cultural Center (ECC)",
      location: {
        latitude: 47.655083728427584,
        longitude: -122.31454685080847,
      },
    },
    {
      name: "Savery Hall (SAV)",
      location: {
        latitude: 47.657077531986964,
        longitude: -122.30843471752385,
      },
    },
    {
      name: "Schmitz Hall (SMZ)",
      location: {
        latitude: 47.656710932891095,
        longitude: -122.31281077598702,
      },
    },
    {
      name: "Sieg Hall (SIG)",
      location: {
        latitude: 47.65482274873043,
        longitude: -122.30671231803865,
      },
    },
    {
      name: "Smith Hall (SMI)",
      location: {
        latitude: 47.656394649030126,
        longitude: -122.30760912801728,
      },
    },
    {
      name: "Social Work/Speech and Hearing Sciences Building (SWS)",
      location: {
        latitude: 47.657120672363504,
        longitude: -122.31239506339172,
      },
    },
    {
      name: "South Campus Center (SOCC)",
      location: {
        latitude: 47.64944537094184,
        longitude: -122.31156182633748,
      },
    },
    {
      name: "Husky Stadium (STD)",
      location: {
        latitude: 47.650676328253795,
        longitude: -122.30322392179896,
      },
    },
    {
      name: "Stevens Court (SCA)",
      location: {
        latitude: 47.654402182885086,
        longitude: -122.31595034702345,
      },
    },
    {
      name: "Husky Union Building (HUB)",
      location: {
        latitude: 47.65491709706143,
        longitude: -122.3056741257775,
      },
    },
    {
      name: "Suzzallo Library (SUZ)",
      location: {
        latitude: 47.65569067672928,
        longitude: -122.30796072007158,
      },
    },
    {
      name: "Terry Hall (TEH)",
      location: {
        latitude: 47.65597962648944,
        longitude: -122.31500713653254,
      },
    },
    {
      name: "Theodor Jacobsen Observatory (OBS)",
      location: {
        latitude: 47.66041756450559,
        longitude: -122.30923047397464,
      },
    },
    {
      name: "Thomson Hall (THO)",
      location: {
        latitude: 47.65648102453225,
        longitude: -122.30575637589331,
      },
    },
    {
      name: "Transportation Services Building (TSB)",
      location: {
        latitude: 47.6563852981585,
        longitude: -122.31374180647059,
      },
    },
    {
      name: "UW Police Department (UWPD)",
      location: {
        latitude: 47.65425359063252,
        longitude: -122.31279817829237,
      },
    },
    {
      name: "UW Tower Buildings (UWT)",
      location: {
        latitude: 47.66053407070847,
        longitude: -122.31463472047123,
      },
    },
    {
      name: "Waterfront Activities Center (WAC)",
      location: {
        latitude: 47.64867830865268,
        longitude: -122.30010687993698,
      },
    },
    {
      name: "West Campus Utility Plant (WCUP)",
      location: {
        latitude: 47.65383384646937,
        longitude: -122.31313511757953,
      },
    },
    {
      name: "Wilcox Hall (WIL)",
      location: {
        latitude: 47.65194037461812,
        longitude: -122.30436998284932,
      },
    },
    {
      name: "Genome Sciences Building (GEN)",
      location: {
        latitude: 47.65195176203448,
        longitude: -122.31326564890736,
      },
    },
    {
      name: "William H. Gates Hall (LAW)",
      location: {
        latitude: 47.659370039022754,
        longitude: -122.31105392377053,
      },
    },
    {
      name: "Willow Hall (WLW)",
      location: {
        latitude: 47.65946849274097,
        longitude: -122.30431356541132,
      },
    },
    {
      name: "Wilson Annex (WLA)",
      location: {
        latitude: 47.65131959100035,
        longitude: -122.30498259203064,
      },
    },
    {
      name: "Wilson Ceramic Laboratory (WCL)",
      location: {
        latitude: 47.651825747765756,
        longitude: -122.30491230445966,
      },
    },
    {
      name: "Winkenwerder Forest Sciences Laboratory (WFS)",
      location: {
        latitude: 47.65125849356901,
        longitude: -122.30702974653657,
      },
    },
  ];

  // change this to server side
  /**
   * Get the coordinates of a building by its name. Throws an error if the building is not found.
   *
   * @param buildingName
   * @returns
   */
  static getBuildingCoordinates(buildingName: string): Coordinates {
    const building = BuildingService.Buildings.find(
      (building) => building.name === buildingName
    );
    if (!building) {
      throw new Error(`Building ${buildingName} not found`);
    }
    return building.location;
  }

  /**
   * Get the coordinates of a building's front by its name. Throws an error if the building is not found or if it does not have a front.
   *
   * @param buildingName
   * @returns
   */
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

  /**
   * Get the coordinates of a building's back by its name. Throws an error if the building is not found or if it does not have a back.
   *
   * @param buildingName
   * @returns
   */
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

  /**
   * Get the closes building to the user based on their coordinates.
   *
   * @param coord user location
   * @returns
   */
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

  /**
   * HELPER FUNCTION to closestBuildingEntranceCoordinates
   * Find the closest building entrance based on the user's coordinates and the building specified
   *
   * @param closestBuilding
   * @param coord user locations
   * @returns
   */
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

  /**
   * Get the closest building entrance's coordinates based on the user's coordinates and the building specified
   *
   * @param closestBuilding
   * @param coord
   * @returns
   */
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

  /**
   * Get the top three closest buildings to the user based on their coordinates.
   *
   * @param coord user location
   * @returns
   */
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

/**
 * Returns the names of all buildings in the BuildingService.
 *
 * @returns
 */
export function getBuildingNames(): string[] {
  return BuildingService.Buildings.map((b) => b.name);
}