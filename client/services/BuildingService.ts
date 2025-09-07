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
        latitude: 47.65287038631524,
        longitude: -122.30875655474162,

      },
    },
    {
      name: "Bank of America Executive Education Center",
      location: {
        latitude: 47.659526047741394,
        longitude: -122.30777736130813,
      },
    },
    {
      name: "Benjamin Hall Interdisciplinary Research Building",
      location: {
        latitude: 47.65531073602157,
        longitude: -122.32138168272783,
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
        latitude: 47.65139405318845,
        longitude: -122.3079397858276,
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
        latitude: 47.65471288073426,
        longitude: -122.31477795471831,
      },
    },
    {
      name: "Burke Memorial-Washington State Museum",
      location: {
        latitude: 47.66036060983427,
        longitude: -122.31151504535191,
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
        latitude: 47.6537311304745,
        longitude: -122.31007096643471,
      },
    },
    {
      name: "Clark Hall (CLK)",
      location: {
        latitude: 47.65764814879635,
        longitude: -122.30490761099739,
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
        latitude: 47.65661485766775,
        longitude: -122.31613610113087,
      },
    },
    {
      name: "Conibear Shellhouse (CSH)",
      location: {
        latitude: 47.652835945927166,
        longitude: -122.29982469941218,
      },
    },
    {
      name: "Dempsey Hall (DEM)",
      location: {
        latitude: 47.65909232919698,
        longitude: -122.30774789289713,
      },
    },
    {
      name: "Dempsey Indoor Center (IPF)",
      location: {
        latitude: 47.651378074574836,
        longitude: -122.2992680699251,
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
        latitude: 47.657747996090855,
        longitude: -122.2889389771151,
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
        latitude: 47.65361107404234,
        longitude: -122.30643948634754,
      },
    },
    {
      name: "Elm Hall (ELM)",
      location: {
        latitude: 47.65638585336721,
        longitude: -122.31527914307291,
      },
    },
    {
      name: "Engineering Annex (EGA)",
      location: {
        latitude: 47.65374144402935,
        longitude: -122.30432571836891,
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
      name: "Ethnic Cultural Center Theatre (ICT)",
      location: {
        latitude: 47.65513840219722,
        longitude: -122.3141840596632,
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
        latitude: 47.65115348886827,
        longitude: -122.31163028582748,
      },
    },
    {
      name: "Fisheries Teaching and Research Building (FTR)",
      location: {
        latitude: 47.65247331783616,
        longitude: -122.31562159433554,
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
        latitude: 47.6566295987603,
        longitude: -122.31357267998125,
      },
    },
    {
      name: "Fluke Hall (FLK)",
      location: {
        latitude: 47.65578675700944,
        longitude: -122.30331521836878,
      },
    },
    {
      name: "Founders Hall (FNDR)",
      location: {
        latitude: 47.658626,
        longitude: -122.307049,
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
        latitude: 47.654911817309845,
        longitude: -122.31275364720493,
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
        latitude: 47.652281471814476,
        longitude: -122.3009229909369,
      },
    },
    {
      name: "Graves Hall (TGB)",
      location: {
        latitude: 47.65304215424515,
        longitude: -122.30225942385168,
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
        latitude: 47.6542409931515,
        longitude: -122.30638038538035,
      },
    },
    {
      name: "Guthrie Hall (GTH)",
      location: {
        latitude: 47.653969078745526,
        longitude: -122.3108290162179,
      },
    },
    {
      name: "Haggett Hall (HGT)",
      location: {
        latitude: 47.65925859883902,
        longitude: -122.30375259352043,
      },
    },
    {
      name: "Hall Health Center (HHC)",
      location: {
        latitude: 47.65615182496788,
        longitude: -122.304285913818,
      },
    },
    {
      name: "Hans Rosling Center for Population Health (HRC)",
      location: {
        latitude: 47.654451228592144,
        longitude: -122.31182062022164,
      },
    },
    {
      name: "Hansee Hall (HNS)",
      location: {
        latitude: 47.660839223202295,
        longitude: -122.30650124535194,
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
        latitude: 47.652188234640576,
        longitude: -122.30242415276336,
      },
    },
    {
      name: "Henderson Hall (HND)",
      location: {
        latitude: 47.655199017389194,
        longitude: -122.3169908472049,
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
      // no parking lot or street nearby??
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
        latitude: 47.658275944657454,
        longitude: -122.30489274905756,
      },
    },
    {
      name: "Intramural Activities Building (IMA)",
      location: {
        latitude: 47.65360652520379,
        longitude: -122.30134386863031,
      },
    },
    {
      name: "Isaacson Hall (ISA)",
      location: {
        latitude: 47.65789332686393,
        longitude: -122.29000306708642,
      },
    },
    {
      name: "John M. Wallace Hall (ACC)",
      location: {
        latitude: 47.65306395249528,
        longitude: -122.3148897318607,
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
        latitude: 47.65662004442798,
        longitude: -122.30906447233552,
      },
    },
    {
      name: "Kincaid Hall (KIN)",
      location: {
        latitude: 47.652593826278505,
        longitude: -122.31059607418844,
      },
    },
    {
      name: "Lander Hall (LAN)",
      location: {
        latitude: 47.655798083774954,
        longitude: -122.31504353371332,
      },
    },
    {
      name: "Laurel Village (LAV)",
      location: {
        latitude: 47.660128297236355,
        longitude: -122.2914821797462,
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
        latitude: 47.65229268934145,
        longitude: -122.30983577789407,
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
        latitude: 47.66008489257747,
        longitude: -122.30521483186024,
      },
    },
    {
      name: "Magnuson Health Sciences Center A (HSA)",
      location: {
        latitude: 47.6502737362422,
        longitude: -122.30829369138576,
      },
    },
    {
      name: "Magnuson Health Sciences Center B (HSB)",
      location: {
        latitude: 47.64971038472927,
        longitude: -122.30911559323854,
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
        latitude: 47.64976782626585,
        longitude: -122.3124911067302,
      },
    },
    {
      name: "Marine Studies Building (MAR)",
      location: {
        latitude: 47.65246404385248,
        longitude: -122.31490681651631,
      },
    },
    {
      name: "Mary Gates Hall (MGH)",
      location: {
        latitude: 47.65494216544692,
        longitude: -122.3079267829135,
      },
    },
    {
      name: "McCarty Hall (MCC)",
      location: {
        latitude: 47.660606397225976,
        longitude: -122.30501618953237,
      },
    },
    {
      name: "Maple Hall (MAH)",
      location: {
        latitude: 47.65584432458446,
        longitude: -122.31610235884385,
      },
    },
    {
      name: "McMahon Hall (MCM)",
      location: {
        latitude: 47.65813688032979,
        longitude: -122.30383106440199,
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
        latitude: 47.653497830133276,
        longitude: -122.30481300101852,
      },
    },
    {
      name: "Mercer Court (MRC)",
      // multiple enterances for this
      location: {
        latitude: 47.65481930770117,
        longitude: -122.31760013031219,
      },
    },
    {
      name: "Odegaard Library",
      location: {
        latitude: 47.657212074889294,
        longitude: -122.30487145010869,
      },
    },
    {
      name: "Merrill Hall (NMH)",
      location: {
        latitude: 47.65778833866146,
        longitude: -122.29046506069648,
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
      // multiple enterances for this
      location: {
        latitude: 47.65441559802646,
        longitude: -122.30991977048294,
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
        latitude: 47.657680906124895,
        longitude: -122.30584244349934,
      },
    },
    {
      name: "North Physics Laboratory Cyclotron Shop (NPS)",
      location: {
        latitude: 47.65909296067042,
        longitude: -122.30296184720471,
      },
    },
    {
      name: "Oak Hall (OAK)",
      location: {
        // not sure about this one
        latitude: 47.65945356458997,
        longitude: -122.30532243786992,
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
        latitude: 47.651218834114886,
        longitude: -122.3127056472052,
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
      // is this location sus, would it be hard for students to find?
      location: {
        latitude: 47.65936371854245,
        longitude: -122.30887362815483,
      },
    },
    {
      name: "Padelford Hall (PDL)",
      location: {
        latitude: 47.656765092938016,
        longitude: -122.30451585276315,
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
        latitude: 47.6532784439652,
        longitude: -122.30601114720497,
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
        latitude: 47.653054862521266,
        longitude: -122.31098385884411,
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
      name: "Physcics/Astromony Auditorium (PAA)",
      location: {
        latitude: 47.653054862521266,
        longitude: -122.31098385884411,
      },
    },
    {
      name: "Plant Operations Annexes (POA)",
      location: {
        latitude: 47.6544001231045,
        longitude: -122.30334939133652,
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
      // multiple enterances for this?
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
        latitude: 47.65437266325087,
        longitude: -122.31365034535222,
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
        latitude: 47.65508894241014,
        longitude: -122.31479882844505,
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
        latitude: 47.64941256717046,
        longitude: -122.31101753286696,
      },
    },
    {
      name: "Stadium (STD)",
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
      // these coordinates are in the middle of the HUB, but 
      //google maps really doesn't let me get closer to the actual entrance
      location: {
        latitude: 47.65542540527123,
        longitude: -122.30542782562033,
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
        latitude: 47.655823144441726,
        longitude: -122.31698781822202,
      },
    },
    {
      name: "Theodor Jacobsen Observatory (OBS)",
      location: {
        latitude: 47.660328941933344,
        longitude: -122.30929798649053,
      },
    },
    {
      name: "Thomson Hall (THO)",
      // multiple enterances, skagit lane, or nearby parking lot
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
        latitude: 47.65438418252918,
        longitude: -122.31270865075687,
      },
    },
    {
      name: "UW Tower Buildings (UWT)",
      location: {
        latitude: 47.66072509296734,
        longitude: -122.31467676055061,
      },
    },
    {
      name: "Waterfront Activities Center (WAC)",
      location: {
        latitude: 47.648553805169854,
        longitude: -122.29994440019453,
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
        latitude: 47.65976050323816,
        longitude: -122.30463500891858,
      },
    },
    {
      name: "Wilson Annex (WLA)",
      location: {
        latitude: 47.65135481540129,
        longitude: -122.30521236240068,
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
        latitude: 47.65143140031929,
        longitude: -122.30682588763861,
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
