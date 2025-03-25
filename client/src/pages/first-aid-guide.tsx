import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const firstAidGuides = [
  {
    id: "burns",
    title: "Burns",
    content: {
      description: "Burns are damage to the skin caused by heat, chemicals, electricity, or radiation.",
      types: [
        { title: "First-degree burns", description: "Affect only the outer layer of skin" },
        { title: "Second-degree burns", description: "Affect both the outer and underlying layer of skin" },
        { title: "Third-degree burns", description: "Affect deep tissues and require emergency medical attention" }
      ],
      steps: [
        "Cool the burn with cool (not cold) running water for 10-15 minutes",
        "Remove tight items, such as jewelry, before the area swells",
        "Don't break blisters as this can lead to infection",
        "Apply an aloe vera lotion or moisturizer to soothe the area",
        "Cover the burn with a sterile, non-stick bandage wrapped loosely",
        "Take over-the-counter pain relievers if needed"
      ],
      whenToSeekHelp: [
        "Burns covering a large area of the body",
        "Third-degree burns",
        "Burns on the face, hands, feet, genitals, or major joints",
        "Burns caused by chemicals or electricity",
        "Difficulty breathing or signs of smoke inhalation",
        "Signs of infection such as increased pain, redness, swelling"
      ]
    }
  },
  {
    id: "cuts",
    title: "Cuts & Scrapes",
    content: {
      description: "Cuts and scrapes are open wounds that damage the skin's surface.",
      types: [
        { title: "Abrasions (scrapes)", description: "Surface wounds that don't penetrate all skin layers" },
        { title: "Lacerations", description: "Deep cuts that may require stitches" },
        { title: "Puncture wounds", description: "Deep holes made by pointed objects" }
      ],
      steps: [
        "Wash your hands thoroughly before treating the wound",
        "Stop the bleeding by applying gentle pressure with a clean cloth or bandage",
        "Clean the wound under running water, removing any dirt or debris",
        "Apply an antiseptic solution or antibiotic ointment",
        "Cover the wound with a sterile bandage or dressing",
        "Change the dressing regularly and keep the wound clean and dry"
      ],
      whenToSeekHelp: [
        "Deep cuts that may need stitches",
        "Cuts with jagged edges that don't close easily",
        "Wounds that won't stop bleeding after 10-15 minutes of pressure",
        "Puncture wounds, especially from rusty objects",
        "Signs of infection like increasing redness, swelling, or pus",
        "Cuts over joints or tendons where movement might be affected"
      ]
    }
  },
  {
    id: "sprains",
    title: "Sprains & Strains",
    content: {
      description: "Sprains are injured ligaments (tissues connecting bones), while strains are injured muscles or tendons.",
      types: [
        { title: "Mild sprains/strains", description: "Slight stretching of ligaments or muscles" },
        { title: "Moderate sprains/strains", description: "Partial tearing with some loss of function" },
        { title: "Severe sprains/strains", description: "Complete tears and significant loss of function" }
      ],
      steps: [
        "Follow the R.I.C.E. method: Rest, Ice, Compression, Elevation",
        "Rest the injured area and avoid activities that cause pain",
        "Apply ice wrapped in a cloth for 15-20 minutes, 4-8 times daily",
        "Use compression with an elastic bandage to reduce swelling",
        "Elevate the injured area above heart level when possible",
        "Take over-the-counter pain medications as needed"
      ],
      whenToSeekHelp: [
        "Inability to bear weight on the injured joint",
        "Severe pain or swelling",
        "Inability to move the joint through its normal range of motion",
        "Numbness in any part of the injured area",
        "If you heard a pop or snap when the injury occurred",
        "If symptoms don't improve within a few days with home treatment"
      ]
    }
  },
  {
    id: "choking",
    title: "Choking",
    content: {
      description: "Choking occurs when an object gets stuck in the throat or windpipe, blocking the flow of air.",
      types: [
        { title: "Mild choking", description: "Person can cough and speak" },
        { title: "Severe choking", description: "Person cannot speak, cough, or breathe" }
      ],
      steps: [
        "Encourage the person to cough if they can still speak or cough",
        "For a conscious adult or child (over 1 year) who can't speak or cough:",
        "Stand behind the person and wrap your arms around their waist",
        "Make a fist with one hand and place it just above the person's navel",
        "Grasp your fist with your other hand and press inward and upward with quick thrusts",
        "Repeat until the object is expelled or the person becomes unconscious"
      ],
      whenToSeekHelp: [
        "If Heimlich maneuver doesn't work after several attempts",
        "If the person becomes unconscious - call 911 immediately and begin CPR",
        "If the person has difficulty breathing after the object is removed",
        "If the person experiences persistent pain or coughing after the incident",
        "Any choking incident in children under 1 year",
        "Any severe choking incident even if it resolves"
      ]
    }
  },
  {
    id: "allergic",
    title: "Allergic Reactions",
    content: {
      description: "Allergic reactions occur when the immune system responds to a substance (allergen) that's typically harmless.",
      types: [
        { title: "Mild reactions", description: "Localized symptoms like hives or rashes" },
        { title: "Moderate reactions", description: "More widespread symptoms including swelling" },
        { title: "Severe reactions (anaphylaxis)", description: "Life-threatening condition affecting multiple body systems" }
      ],
      steps: [
        "For mild reactions, remove the allergen if possible",
        "Wash the affected area with soap and water for contact allergies",
        "Apply a cold compress to reduce swelling and itching",
        "Take an antihistamine to relieve symptoms if available",
        "Monitor for signs of worsening or spreading reaction",
        "For known severe allergies, use prescribed epinephrine auto-injector (e.g., EpiPen)"
      ],
      whenToSeekHelp: [
        "Any signs of anaphylaxis: difficulty breathing, swelling of lips/tongue/throat",
        "Dizziness, fainting, or rapid heartbeat",
        "Nausea, vomiting, or abdominal pain with a rash or swelling",
        "If symptoms spread quickly over the body",
        "If symptoms don't improve with antihistamine",
        "After using an epinephrine auto-injector (call 911 immediately)"
      ]
    }
  }
];

export default function FirstAidGuide() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("burns");
  
  const filteredGuides = searchTerm
    ? firstAidGuides.filter(guide => 
        guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guide.content.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : firstAidGuides;
  
  const currentGuide = firstAidGuides.find(guide => guide.id === activeTab);
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">First Aid Guide</h1>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
        <Input
          className="pl-10"
          placeholder="Search first aid guides..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full flex overflow-x-auto py-2">
          {filteredGuides.map((guide) => (
            <TabsTrigger
              key={guide.id}
              value={guide.id}
              className="flex-shrink-0"
            >
              {guide.title}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {currentGuide && (
          <TabsContent value={currentGuide.id} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{currentGuide.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>{currentGuide.content.description}</p>
                
                <h3 className="text-lg font-medium mt-4">Types of {currentGuide.title}</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {currentGuide.content.types.map((type, index) => (
                    <li key={index}>
                      <span className="font-medium">{type.title}:</span> {type.description}
                    </li>
                  ))}
                </ul>
                
                <h3 className="text-lg font-medium mt-4">First Aid Steps</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  {currentGuide.content.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mt-6">
                  <h3 className="text-lg font-medium text-yellow-800">When to Seek Medical Help</h3>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-yellow-700">
                    {currentGuide.content.whenToSeekHelp.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
