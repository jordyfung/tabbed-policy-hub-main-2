export interface QualityAction {
  id: string;
  description: string;
  linkedPolicies?: string[];
  linkedTraining?: string[];
  evidence?: string[];
  operationalImpact?: string;
}

export interface QualityOutcome {
  id: string;
  title: string;
  statement: string;
  actions: QualityAction[];
}

export interface QualityStandard {
  id: number;
  title: string;
  intent: string;
  expectationStatement: string;
  outcomes: QualityOutcome[];
}

export const qualityStandardsData: QualityStandard[] = [
  {
    id: 1,
    title: "The Individual",
    intent: "Standard 1 underpins the way that providers and aged care workers are expected to treat older people and is relevant to all standards. Standard 1 reflects important concepts about dignity and respect, individuality and diversity, independence, choice and control, culturally safe care and dignity of risk.",
    expectationStatement: "I have the right to be treated with dignity and respect and to live free from any form of discrimination. I make decisions about my funded aged care services, with support when I want or need it. My identity, culture and diversity are valued and supported, and I have the right to live the life I choose.",
    outcomes: [
      {
        id: "1.1",
        title: "Person-centred care",
        statement: "The provider demonstrates that the provider understands that the safety, health, wellbeing and quality of life of individuals is the primary consideration in the delivery of funded aged care services.",
        actions: [
          {
            id: "1.1.1",
            description: "The way the provider and aged care workers engage with individuals supports them to feel safe, welcome, included and understood."
          },
          {
            id: "1.1.2",
            description: "The provider implements strategies to identify the individual background, culture, diversity, beliefs and life experiences as part of assessment and planning and uses this to direct the way their funded aged care services are delivered."
          },
          {
            id: "1.1.3",
            description: "The provider and aged care workers recognise the rights, and respect the autonomy, of individuals, including their right to intimacy and sexual and gender expression."
          },
          {
            id: "1.1.4",
            description: "Aged care workers have professional and trusting relationships with individuals and work in partnership with them to deliver funded aged care services."
          }
        ]
      },
      {
        id: "1.2",
        title: "Dignity, respect and privacy",
        statement: "The provider must deliver funded aged care services to individuals in a way that is free from all forms of discrimination, abuse and neglect, treats individuals with dignity and respect, and respects the personal privacy of individuals.",
        actions: [
          {
            id: "1.2.1",
            description: "The provider implements a system to recognise, prevent and respond to violence, abuse, racism, neglect, exploitation and discrimination."
          },
          {
            id: "1.2.2",
            description: "Individuals are treated with kindness, dignity and respect."
          },
          {
            id: "1.2.3",
            description: "The relationship between individuals and the supporters of individuals is recognised and respected."
          },
          {
            id: "1.2.4",
            description: "The personal privacy of individuals is respected, individuals have choice about how and when they receive intimate personal care or treatment, and this is carried out sensitively and in private."
          }
        ]
      },
      {
        id: "1.3",
        title: "Choice, independence and quality of life",
        statement: "The provider must support individuals to exercise choice and make decisions about their funded aged care services and provide them with support to exercise choice and make decisions when they want or need it.",
        actions: [
          {
            id: "1.3.1",
            description: "The provider implements a system to ensure information given to individuals to enable them to make informed decisions about their funded aged care and services is current, accurate and timely."
          },
          {
            id: "1.3.2",
            description: "The provider implements a system to ensure that individuals give their informed consent where this is required for a treatment, procedure or other intervention."
          },
          {
            id: "1.3.3",
            description: "The provider implements a system to ensure individuals who require support with decision-making are identified and provided access to the support necessary to make, communicate and participate in decisions that affect their lives."
          },
          {
            id: "1.3.4",
            description: "The provider supports individuals to access advocates of their choosing."
          },
          {
            id: "1.3.5",
            description: "The provider supports individuals to live the best life they can, including by understanding the individual's goals and preferences and enabling positive risk-taking that promotes the individual's autonomy and quality of life."
          },
          {
            id: "1.3.6",
            description: "The provider records, monitors and responds to changes to the individual's quality of life."
          }
        ]
      },
      {
        id: "1.4",
        title: "Transparency and agreements",
        statement: "Before entering into any agreements with individuals about the delivery of funded aged care services, the provider must provide individuals with the opportunity to exercise autonomy, the time they need to consider the agreement and an opportunity to seek advice.",
        actions: [
          {
            id: "1.4.1",
            description: "Prior to entering into any agreement or commencing funded aged care services (whichever comes first), the provider gives individuals information to enable them to make informed decisions about their funded aged care services."
          },
          {
            id: "1.4.2",
            description: "The provider supports individuals to understand information provided to them, including any agreement they will be required to enter into, the terms relating to their rights and responsibilities, the funded aged care services to be provided and the fees and other charges to be paid."
          },
          {
            id: "1.4.3",
            description: "The provider allows individuals the time they need to consider and review their options and seek external advice before making decisions."
          },
          {
            id: "1.4.4",
            description: "The provider informs the individual of any changes to previously agreed fees and charges and seeks their informed consent to implement these changes before they are made."
          },
          {
            id: "1.4.5",
            description: "The provider implements a system to ensure prices, fees and payments are accurate and transparent for individuals."
          },
          {
            id: "1.4.6",
            description: "The provider ensures invoices are timely, accurate, clear and presented in a way the individual understands."
          },
          {
            id: "1.4.7",
            description: "The provider promptly addresses any overcharging and provides refunds to individuals."
          }
        ]
      }
    ]
  },
  {
    id: 2,
    title: "The Organisation",
    intent: "The intent of Standard 2 is to set out the expectations of the governing body to meet the requirements of the Quality Standards and deliver quality funded aged care services.",
    expectationStatement: "The organisation is well run. I can contribute to improvements to funded aged care services. My provider and aged care workers listen and respond to my feedback and concerns. I receive funded aged care services from aged care workers who are knowledgeable, competent, capable and caring.",
    outcomes: [
      {
        id: "2.1",
        title: "Partnering with individuals",
        statement: "The provider must engage in meaningful and active partnerships with individuals to inform organisational priorities and continuous improvement.",
        actions: [
          {
            id: "2.1.1",
            description: "The governing body partners with individuals to set priorities and strategic directions for the way their funded aged care services are provided."
          },
          {
            id: "2.1.2",
            description: "The provider supports individuals to participate in partnerships and partners with individuals who reflect the diversity of those who use their funded aged care services."
          },
          {
            id: "2.1.3",
            description: "The provider partners with individuals in the design, delivery, evaluation and improvement of quality funded aged care services."
          }
        ]
      },
      {
        id: "2.2a",
        title: "Quality, safety and inclusion culture to support aged care workers to deliver quality care",
        statement: "The governing body must lead a culture of quality, safety and inclusion that supports aged care workers to provide quality funded aged care services by focussing on continuous improvement, embracing diversity and prioritising the safety, health and wellbeing of aged care workers.",
        actions: [
          {
            id: "2.2.1",
            description: "The governing body leads a positive culture of quality funded aged care services and continuous improvement and demonstrates that this culture exists within the organisation."
          },
          {
            id: "2.2.2",
            description: "In strategic and business planning, the governing body prioritises the safety, health and wellbeing of aged care workers and proactively engages, listens, consults with aged care workers to leverage their expertise in delivering quality funded aged care services to individuals."
          }
        ]
      },
      {
        id: "2.2b",
        title: "Quality, safety and inclusion culture to support individuals",
        statement: "The governing body must lead a culture of quality, safety and inclusion that supports individuals accessing quality funded aged care services by focussing on continuous improvement, embracing diversity and prioritising the safety, health and wellbeing of individuals.",
        actions: [
          {
            id: "2.2.1",
            description: "The governing body leads a positive culture of quality funded aged care services and continuous improvement and demonstrates that this culture exists within the organisation."
          },
          {
            id: "2.2.2",
            description: "In strategic and business planning, the governing body prioritises the physical and psychological safety, health and wellbeing of individuals and ensures that funded aged care services are accessible to, and appropriate for, individuals with specific needs and diverse backgrounds."
          }
        ]
      }
    ]
  },
  {
    id: 3,
    title: "The Care and Services",
    intent: "Standard 3 describes the way providers must deliver funded aged care services for all types of services being delivered. Effective assessment and planning, communication and coordination relies on a strong and supported workforce as described in Standard 2 and is critical to the delivery of quality funded aged care services that meet the older person's needs, are tailored to their preferences and support them to live their best lives.",
    expectationStatement: "The funded aged care services I receive are safe and effective, optimise my quality of life, including through maximising independence and reablement, meet my current needs, goals and preferences, are well planned and coordinated, and respect my right to take risks.",
    outcomes: [
      {
        id: "3.1",
        title: "Assessment and planning",
        statement: "The provider must actively engage with individuals to whom the provider delivers funded aged care services, supporters of individuals (if any) and any other persons involved in the care of individuals in developing and reviewing the individual's care and services plans through ongoing communication.",
        actions: [
          {
            id: "3.1.1",
            description: "The provider implements a system for assessment and planning that identifies and records the needs, goals and preferences of the individual and identifies risks to the individual's health, safety and wellbeing."
          },
          {
            id: "3.1.2",
            description: "Assessment and planning is based on ongoing communication and partnership with the individual and others that the individual wishes to involve."
          },
          {
            id: "3.1.3",
            description: "The outcomes of assessment and planning are effectively communicated to the individual, in a way they understand, and to the individual's supporters and others involved in their care, with the individual's informed consent."
          }
        ]
      },
      {
        id: "3.2",
        title: "Delivery of funded aged care services",
        statement: "The provider must ensure that individuals receive quality funded aged care services that meet their needs, goals and preferences and optimise their quality of life, reablement and maintenance of function.",
        actions: [
          {
            id: "3.2.1",
            description: "Individuals receive culturally safe, trauma aware and healing informed funded aged care services that are provided in accordance with contemporary, evidence-based practices and meet their current needs, goals and preferences."
          },
          {
            id: "3.2.2",
            description: "The provider delivers funded aged care services in a way that optimises the individual's quality of life, reablement and maintenance of function, where this is consistent with their preferences."
          },
          {
            id: "3.2.3",
            description: "Individuals are supported to use equipment, aids, devices and products safely and effectively."
          }
        ]
      }
    ]
  },
  {
    id: 4,
    title: "The Environment",
    intent: "The intent of Standard 4 is to ensure that older people receive funded aged care services in a physical environment that is safe, supportive and meets their needs. Effective infection prevention and control measures are a core component of service delivery to protect older people, their supporters and aged care workers.",
    expectationStatement: "I feel safe when receiving funded aged care services. Where I receive funded aged care services through a service environment, the environment is clean, safe and comfortable and enables me to move around freely. Equipment is safe, appropriate and well-maintained and precautions are taken to prevent the spread of infections.",
    outcomes: [
      {
        id: "4.1a",
        title: "Environment – services delivered in the individual's home",
        statement: "When delivering funded aged care services to individuals in their homes, the provider must support the individuals to mitigate environmental risks relevant to the services.",
        actions: [
          {
            id: "4.1.1",
            description: "Where funded aged care services are delivered in the individual's home, as relevant to the services being delivered, the provider identifies any environmental risks to the safety of the individual and discusses with the individual any environmental risks and options to mitigate these."
          },
          {
            id: "4.1.2",
            description: "Equipment and aids provided by the provider are safe, clean, well-maintained and meets the needs of individuals."
          }
        ]
      },
      {
        id: "4.1b",
        title: "Environment – services delivered other than in the individual's home",
        statement: "Where the provider delivers funded aged care services to individuals other than in their homes, the provider must ensure that individuals are able to access funded aged care services in a clean, safe and comfortable environment that optimises their sense of belonging, interaction and function.",
        actions: [
          {
            id: "4.1.1",
            description: "The provider ensures the service environment is routinely cleaned and well-maintained, safe, welcoming and comfortable, and fit-for-purpose."
          },
          {
            id: "4.1.2",
            description: "The provider ensures the service environment is accessible, including for individuals with a disability, promotes movement, engagement and inclusion through design, enables individuals to move freely both indoors and outdoors, and unobtrusively reduces safety risks, optimises useful stimulation and is easy to navigate."
          },
          {
            id: "4.1.3",
            description: "Equipment used in the delivery of funded aged care services is safe, clean, well-maintained and meets the needs of individuals."
          }
        ]
      },
      {
        id: "4.2",
        title: "Infection prevention and control",
        statement: "The provider must have an appropriate infection prevention and control system. The provider must ensure that aged care workers use hygienic practices and take appropriate infection prevention and control precautions when delivering funded aged care services.",
        actions: [
          {
            id: "4.2.1",
            description: "The provider implements a system for infection prevention and control that is used where funded aged care services are delivered, which identifies an appropriately qualified and trained infection prevention and control lead and prioritises the rights, safety, health and wellbeing of individuals."
          }
        ]
      }
    ]
  },
  {
    id: 5,
    title: "Clinical Care",
    intent: "The Clinical Care Standard describes the responsibilities of providers to deliver safe and quality clinical care services to older people. The governing body has overall responsibility to ensure a clinical governance framework is implemented and to monitor its effectiveness in supporting aged care workers to deliver quality clinical care services.",
    expectationStatement: "I receive person-centred, evidence-based, safe, effective, and coordinated clinical care services by registered health practitioners, allied health professionals, allied health assistants and competent aged care workers that meets my changing clinical needs and is in line with my goals and preferences.",
    outcomes: [
      {
        id: "5.1",
        title: "Clinical governance",
        statement: "The governing body must ensure that the governing body continuously improves the safety and quality of clinical care services to individuals and that the provider delivers safe and quality clinical care services to individuals.",
        actions: [
          {
            id: "5.1.1",
            description: "The governing body sets priorities and strategic directions for safe and quality clinical care services and ensures that these are communicated to aged care workers and individuals."
          },
          {
            id: "5.1.2",
            description: "The provider implements the clinical governance framework as part of corporate governance to drive safety and quality improvement."
          },
          {
            id: "5.1.3",
            description: "The provider implements processes to ensure aged care workers providing clinical care services are qualified, competent and work within their defined scope of practice or role."
          }
        ]
      },
      {
        id: "5.2",
        title: "Preventing and controlling infections in delivering clinical care services",
        statement: "The provider must ensure that individuals, aged care workers, registered health practitioners and others are encouraged and supported to use antimicrobials appropriately to reduce risks of increasing resistance.",
        actions: [
          {
            id: "5.2.1",
            description: "The provider implements an antimicrobial stewardship system that complies with contemporary, evidence-based practice and is relevant to the service context."
          },
          {
            id: "5.2.2",
            description: "The provider implements processes to minimise and manage infection when providing clinical care services that include, but are not limited to: performing clean procedures and aseptic techniques, using, managing and reviewing invasive devices including urinary catheters, and minimising the transmission of infections and complications from infections."
          }
        ]
      }
    ]
  },
  {
    id: 6,
    title: "Food and Nutrition",
    intent: "Access to nutritionally adequate food is a fundamental human right. Food, drink and the dining experience can have a huge impact on a person's quality of life. As people age, they may lose their appetite or experience conditions that impact on their ability to eat and drink.",
    expectationStatement: "I receive plenty of food and drinks that I enjoy. Food and drinks are nutritious, appetising and safe, and meet my needs and preferences. The dining experience is enjoyable, includes variety and supports a sense of belonging.",
    outcomes: [
      {
        id: "6.1",
        title: "Partnering with individuals on food and drinks",
        statement: "The provider must partner with individuals to deliver a quality food and drinks service that includes appetising and varied food and drinks and an enjoyable dining experience.",
        actions: [
          {
            id: "6.1.1",
            description: "The provider must partner with individuals on how to create enjoyable food, drinks and dining experiences at the service."
          },
          {
            id: "6.1.2",
            description: "The provider implements a system to monitor and continuously improve the food and drinks service in response to the satisfaction of individuals with the food, drink and the dining experience."
          }
        ]
      },
      {
        id: "6.2",
        title: "Assessment of nutritional needs and preferences",
        statement: "The provider must demonstrate that the provider understands the specific nutritional needs of individuals and assesses the current needs, abilities and preferences of individuals in relation to what and how they eat and drink.",
        actions: [
          {
            id: "6.2.1",
            description: "As part of assessment and planning, the provider assesses and regularly reassesses each individual's nutrition, hydration and dining needs and preferences."
          }
        ]
      }
    ]
  },
  {
    id: 7,
    title: "The Residential Community",
    intent: "When people move into a residential care home, the residential community becomes a central feature of their lives. It is critical that older people feel safe and at home in the residential community, have opportunities to do things that are meaningful to them and are supported to maintain connections with people important to them.",
    expectationStatement: "I am supported to do the things I want and to maintain my relationships and connections with my community. I am confident in the continuity of my care and security of my accommodation.",
    outcomes: [
      {
        id: "7.1",
        title: "Daily living",
        statement: "The provider must ensure that individuals receive funded aged care services that optimise their quality of life, promote use of their skills and strengths and enable them to do the things they want to do.",
        actions: [
          {
            id: "7.1.1",
            description: "The provider supports and enables individuals to do the things they want to do, including to participate in lifestyle activities that reflect the diverse nature of the residential community, promote their quality of life, minimise boredom and loneliness, maintain connections and participate in activities that occur outside the residential community, have social and personal relationships, and contribute to their community through participating in meaningful activities that engage the individual in normal life."
          },
          {
            id: "7.1.2",
            description: "The provider has processes to identify, monitor and record individuals' function in relation to activities of daily living."
          },
          {
            id: "7.1.3",
            description: "The provider implements strategies to protect the physical and psychological safety of individuals."
          }
        ]
      },
      {
        id: "7.2",
        title: "Transitions",
        statement: "The provider must ensure that individuals experience a well-coordinated transition, whether planned or unplanned, to or from a provider.",
        actions: [
          {
            id: "7.2.1",
            description: "The provider has processes for transitioning individuals to and from hospital, other care services and stays in the community, and ensures that use of hospitals or emergency departments are recorded and monitored, there is continuity of care for the individual, individuals and supporters of individuals as appropriate, are engaged in decisions regarding transfers, supporters of individuals, registered health practitioners, allied health professionals, allied health assistants or organisations are given timely, current and complete information about the individual as required, and when the individual transitions back to the residential care home their funded aged care services are reviewed and adjusted as needed."
          },
          {
            id: "7.2.2",
            description: "The provider facilitates access to services offered by registered health practitioners, allied health professionals, allied health assistants, other individuals or organisations when it is unable to meet the individual's needs."
          }
        ]
      }
    ]
  }
];
