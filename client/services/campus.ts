type Coordinates = {
    latitude: number;
    longitude: number;
  };
  
type Building = {
    name: string;
    location: Coordinates;
    front?: Coordinates;
    back?: Coordinates;
  };
      //'Merrill Hall (NMH)','Microsoft Bldg 99 (L260)','Miller Hall (MLR)','Molecular Engineering & Sciences Building (MOL/NAN)','More Hall (MOR)','Mueller Hall (MUE)','Music Building (MUS)','Nordheim Court  (NC)','North Physics Laboratory (NP)','North Physics Laboratory Cyclotron Shop (NPS)','Oak Hall (OAK)','Ocean Research Building 2 (OR2)','Ocean Sciences Building (OCN)','Oceanography Buildings (OCE)','Odegaard Library (OUG)','PACCAR Hall (PCAR)','Padelford Hall (PDL)','Parrington Hall (PAR)','Patricia Bracelin Steel Memorial Building (STE)','Paul G. Allen Center for Computer Science & Engineering (CSE)','Pavilion Pool (PVP)','Physics-Astronomy Auditorium (PAA)','Physics-Astronomy Building (PAB)','Physics-Astronomy Tower (PAT)','Pioneer Building (L257)','Plant Operations Annexes (POA)','Plant Operations/Services Buildings (POB)','Poplar Hall (POP)','Portage Bay Building (PBB)','Power Plant (PWR)','Publications Services Building (PSV)','Purchasing and Accounting Building (PCH)','Rainier Tower (RAIN)','Raitt Hall (RAI)','Roberts Hall (ROB)','Romero House (ROM)','Roosevelt II (QUC)','Samuel E. Kelly Ethnic Cultural Center (ECC)','Savery Hall (SAV)','Schmitz Hall (SMZ)','Sieg Hall (SIG)','Skinner Building (MTA)','Smith Hall (SMI)','Social Work/Speech and Hearing Sciences Building (SWS)','Softball Performance Center (SBPC)','South Campus Center (SOCC)','Southwest Maintenance Building (URC)','Springbrook Building (X152)','Stadium (STD)','Stevens Court (SCA)','Student Union Building (HUB)','Suzzallo Library (SUZ)','Swedish First Hill (SWH)','Terry Hall (TEH)','Theodor Jacobsen Observatory (OBS)','Thomson Hall (THO)','Transportation Services Building (TSB)','University District Building (UDB)','University Facilities Annexes/Building 1 (UF)','University of Washington Club (Faculty Center) (FAC)','Urban Horticulture Field House (UHF)','USGS Western Fisheries Research Center (WFRC)','UW Medical Center (UWMC)','UW Police Department (UWPD)','UW Tower Buildings (UWT)','Washington Dental Service Building for Early Childhood Oral Health (SP5)','Waterfront Activities Center (WAC)','West Campus Utility Plant (WCUP)','Wilcox Hall (WIL)','William H. Foege Bioeng/Genome (BIOE/GNOM)','William H. Gates Hall (LAW)','Willow Hall (WLW)','Wilson Annex (WLA)','Wilson Ceramic Laboratory (WCL)','Winkenwerder Annex (WNX)','Winkenwerder Forest Sciences Laboratory (WFS)'

  
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
        name: "Arboretum Buildingsy",
        location: {
          latitude: 47.6553,
          longitude: -122.30583,
        },
      },
      {
        name: "Architecture Hall",
        location: {
          latitude: 47.6553,
          longitude: -122.30583,  
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
          latitude: 47.6553,
          longitude: -122.30583,  
        },
      },

      {
        name: "Chemistry Library Building (CHL)",
        location: {
          latitude: 47.6553,
          longitude: -122.30583
        }
      },
      {
        name: "Child Learning & Care Center",
        location: {
          latitude: 47.6489,
          longitude: -122.3075
        }
      },
      {
        name: "Clark Hall (CLK)",
        location: {
          latitude: 47.6551,
          longitude: -122.3086
        }
      },
      {
        name: "Collegiana Hospitality House",
        location: {
          latitude: 47.6605,
          longitude: -122.3138
        }
      },
      {
        name: "Communications Building (CMU)",
        location: {
          latitude: 47.6564,
          longitude: -122.3096
        }
      },
      {
        name: "Condon Hall (CDH)",
        location: {
          latitude: 47.655,
          longitude: -122.3123
        }
      },
      {
        name: "Conibear Shellhouse (CSH)",
        location: {
          latitude: 47.6517,
          longitude: -122.3051
        }
      },
      {
        name: "Bullitt Center (L191)",
        location: {
          latitude: 47.6553,
          longitude: -122.30583,  
        },
      },
      {
        name: "Bullitt Center (L191)",
        location: {
          latitude: 47.6553,
          longitude: -122.30583,  
        },
      },
      {
        name: "Dempsey Hall (DEM)",
        location: {
          latitude: 47.6599,
          longitude: -122.3080
        }
      },
      {
        name: "Dempsey Indoor Center (IPF)",
        location: {
          latitude: 47.6510,
          longitude: -122.3010
        }
      },
      {
        name: "Denny Hall (DEN)",
        location: {
          latitude: 47.6566,
          longitude: -122.3090
        }
      },
      {
        name: "Douglas Research Conservatory (DRC)",
        location: {
          latitude: 47.6530,
          longitude: -122.2900
        }
      },
      {
        name: "Eagleson Hall (EGL)",
        location: {
          latitude: 47.6560,
          longitude: -122.3120
        }
      },
      {
        name: "Electrical and Computer Engineering Building (ECE)",
        location: {
          latitude: 47.6535,
          longitude: -122.3035
        }
      },
      {
        name: "Elm Hall (ELM)",
        location: {
          latitude: 47.6565,
          longitude: -122.3135
        }
      },
      {
        name: "Engineering Annex (EGA)",
        location: {
          latitude: 47.6530,
          longitude: -122.3045
        }
      },
      {
        name: "Engineering Library (ELB)",
        location: {
          latitude: 47.6535,
          longitude: -122.3040
        }
      },
      {
        name: "Ethnic Cultural Center Theatre (ICT)",
        location: {
          latitude: 47.6560,
          longitude: -122.3130
        }
      },
      {
        name: "Faye G. Allen Center for the Visual Arts (AVA)",
        location: {
          latitude: 47.6565,
          longitude: -122.3115
        }
      },
      {
        name: "Fialkow Biomedical Sciences Research Pavilion (K wing) (HSK)",
        location: {
          latitude: 47.6515,
          longitude: -122.3090
        }
      },
      {
        name: "Fisheries Teaching and Research Building (FTR)",
        location: {
          latitude: 47.6510,
          longitude: -122.3170
        }
      },
      {
        name: "Fishery Sciences (FSH)",
        location: {
          latitude: 47.6515,
          longitude: -122.3165
        }
      },
      {
        name: "Floyd and Delores Jones Playhouse (PHT)",
        location: {
          latitude: 47.6580,
          longitude: -122.3130
        }
      },
      {
        name: "Fluke Hall (FLK)",
        location: {
          latitude: 47.6530,
          longitude: -122.3040
        }
      },
      {
        name: "Founders Hall (FNDR)",
        location: {
          latitude: 47.6592,
          longitude: -122.3082
        }
      },
      {
        name: "Gerberding Hall (GRB)",
        location: {
          latitude: 47.6565,
          longitude: -122.3090
        }
      },
      {
        name: "Gould Hall (GLD)",
        location: {
          latitude: 47.6560,
          longitude: -122.3130
        }
      },
      {
        name: "Gowen Hall (GWN)",
        location: {
          latitude: 47.6571,
          longitude: -122.3095
        }
      },
      {
        name: "Graves Annex Building (GAB)",
        location: {
          latitude: 47.6512,
          longitude: -122.3038
        }
      },
      {
        name: "Graves Hall (TGB)",
        location: {
          latitude: 47.6510,
          longitude: -122.3035
        }
      },
      {
        name: "Guggenheim Annex (GUA)",
        location: {
          latitude: 47.6533,
          longitude: -122.3050
        }
      },
      {
        name: "Guggenheim Hall (GUG)",
        location: {
          latitude: 47.6531,
          longitude: -122.3052
        }
      },
      {
        name: "Guthrie Hall (GTH)",
        location: {
          latitude: 47.6555,
          longitude: -122.3125
        }
      },
      {
        name: "Haggett Hall (HGT)",
        location: {
          latitude: 47.6578,
          longitude: -122.3039
        }
      },
      {
        name: "Hall Health Center (HLL)",
        location: {
          latitude: 47.6563,
          longitude: -122.3080
        }
      },
      {
        name: "Hans Rosling Center for Population Health (HRC)",
        location: {
          latitude: 47.6535,
          longitude: -122.3087
        }
      },
      {
        name: "Hansee Hall (HNS)",
        location: {
          latitude: 47.6600,
          longitude: -122.3120
        }
      },
      {
        name: "Harris Hydraulics Laboratory (HHL)",
        location: {
          latitude: 47.6538,
          longitude: -122.3083
        }
      },
      {
        name: "Health Sciences Education Building (HSEB)",
        location: {
          latitude: 47.6505,
          longitude: -122.3095
        }
      },
      {
        name: "Hec Edmundson Pavilion (EDP)",
        location: {
          latitude: 47.6502,
          longitude: -122.3044
        }
      },
      {
        name: "Henderson Hall (HND)",
        location: {
          latitude: 47.6517,
          longitude: -122.3089
        }
      },
      {
        name: "Henry Art Gallery (HAG)",
        location: {
          latitude: 47.6565,
          longitude: -122.3100
        }
      },
      {
        name: "Hitchcock Hall (HCK)",
        location: {
          latitude: 47.6532,
          longitude: -122.3085
        }
      },
      {
        name: "Hutchinson Hall (HUT)",
        location: {
          latitude: 47.65961,
          longitude: -122.30662
        }
      },
      {
        name: "Ethnic Cultural Theater (ICT)",
        location: {
          latitude: 47.65518,
          longitude: -122.31419
        }
      },
      {
        name: "Intellectual House (INT)",
        location: {
          latitude: 47.6583,
          longitude: -122.30481
        }
      },
      {
        name: "Intramural Activities Building (IMA)",
        location: {
          latitude: 47.65372,
          longitude: -122.30128
        }
      },
      {
        name: "Isaacson Hall (ISA)",
        location: {
          latitude: 47.65788,
          longitude: -122.28996
        }
      },
      {
        name: "John M. Wallace Hall (ACC)",
        location: {
          latitude: 47.65304,
          longitude: -122.31487
        }
      },
      {
        name: "Johnson Hall (JHN)",
        location: {
          latitude: 47.65487,
          longitude: -122.30907
        }
      },
      {
        name: "Kane Hall (KNE)",
        location: {
          latitude: 47.65658,
          longitude:-122.30919
        }
      },
      {
        name: "Kincaid Hall (KIN)",
        location: {
          latitude: 47.65267,
          longitude: -122.31061
        }
      },
      {
        name: "Lander Hall (LAN)",
        location: {
          latitude: 47.65566,
          longitude: -122.31502
        }
      },
      {
        name: "Laurel Village (LAV)",
        location: {
          latitude: 47.65982,
          longitude: -122.29131
        }
      },
      {
        name: "Lewis Hall (LEW)",
        location: {
          latitude: 47.65885,
          longitude: -122.30538
        }
      },
      {
        name: "Life Sciences Building (LSB)",
        location: {
          latitude: 47.65207,
          longitude: -122.30969
        }
      },
      {
        name: "Loew Hall (LOW)",
        location: {
          latitude: 47.65432,
          longitude: -122.30452
        }
      },
      {
        name: "Madrona Hall (MDR)",
        location: {
          latitude: 47.66012,
          longitude: -122.30522
        }
      },
      {
        name: "Magnuson Health Sciences Center A (HSA)",
        location: {
          latitude: 47.6505,
          longitude: -122.3095
        }
      },
      {
        name: "Magnuson Health Sciences Center B (HSB)",
        location: {
          latitude: 47.6505,
          longitude: -122.3095
        }
      },
      {
        name: "Magnuson Health Sciences Center C (HSC)",
        location: {
          latitude: 47.6505,
          longitude: -122.3095
        }
      },
      {
        name: "Magnuson Health Sciences Center D (HSD)",
        location: {
          latitude: 47.6505,
          longitude: -122.3095
        }
      },
      {
        name: "Magnuson Health Sciences Center E (HSE)",
        location: {
          latitude: 47.6505,
          longitude: -122.3095
        }
      },
      {
        name: "Magnuson Health Sciences Center F (HSF)",
        location: {
          latitude: 47.6505,
          longitude: -122.3095
        }
      },
      {
        name: "Magnuson Health Sciences Center G (HSG)",
        location: {
          latitude: 47.6505,
          longitude: -122.3095
        }
      },
      {
        name: "Magnuson Health Sciences Center H (HSH)",
        location: {
          latitude: 47.6505,
          longitude: -122.3095
        }
      },
      {
        name: "Magnuson Health Sciences Center I (HSI)",
        location: {
          latitude: 47.6505,
          longitude: -122.3095
        }
      },
      {
        name: "Magnuson Health Sciences Center J (HSJ)",
        location: {
          latitude: 47.6505,
          longitude: -122.3095
        }
      },
      {
        name: "Magnuson Health Sciences Center RR (HSRR)",
        location: {
          latitude: 47.6505,
          longitude: -122.3095
        }
      },
      {
        name: "Magnuson Health Sciences Center T (HST)",
        location: {
          latitude: 47.6505,
          longitude: -122.3095
        }
      },
      {
        name: "Marine Sciences Building (MSB)",
        location: {
          latitude: 47.64989,
          longitude: -122.31292,
        }
      },
      {
        name: "Marine Studies Building (MAR)",
        location: {
          latitude: 47.65244,
          longitude: -122.31498,
        }
      },
      {
        name: "Mary Gates Hall (MGH)",
        location: {
          latitude: 47.655,
          longitude: -122.3078,
        }
      },
      {
        name: "McCarty Hall (MCC)",
        location: {
          latitude: 47.66074,
          longitude: -122.30482,
        }
      },
      {
        name: "Maple Hall (MAH)",
        location: {
          latitude: 47.65568,
          longitude: -122.31618,
        }
      },
      {
        name: "McMahon Hall (MCM)",
        location: {
          latitude: 47.6582,
          longitude: -122.30373,
        }
      },
      {
        name: "'Meany Hall (MNY)",
        location: {
          latitude: 47.65557,
          longitude: -122.31058,
        }
      },
      {
        name: "Department of Mechanical Engineering",
        location: {
          latitude: 47.65345,
          longitude: -122.3049,
        }
      },
      {
        name: "Mercer Court (MRC)",
        location: {
          latitude: 47.65442,
          longitude: -122.31781,
        }
      },
      {
        name: "Mary Gates Hall",
        location: {
          latitude: 47.657212074889294,
          longitude: -122.30487145010869,
        },
        front: {
          latitude: 42.5432,
          longitude: -119.3320,
        },
        back: {
          latitude: 42.4339,
          longitude: -119.3320,
        },
      },
      {
        name: "Odegaard Library",
        location: {
          latitude: 47.657212074889294,
          longitude: -122.30487145010869,
        },
        front: {
          latitude: 42.5432,
          longitude: -119.3320,
        },
        back: {
          latitude: 42.4339,
          longitude: -119.3320,
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


  }
  
  