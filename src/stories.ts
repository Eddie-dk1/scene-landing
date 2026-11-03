export type StoryId = "app" | "travel" | "sport";
export type StoryStyle = "calm" | "dynamic";
export interface StoryScene {
  title: string;
  caption: string[];
  image?: string;
  alt?: string;
  art?: "idea" | "timeline" | "play";
}
export interface Story {
  id: StoryId;
  title: string;
  description: string;
  scenes: [StoryScene, StoryScene, StoryScene];
}

export const stories: Record<StoryId, Story> = {
  app: {
    id: "app",
    title: "Приложение",
    description: "Идея, которая становится историей.",
    scenes: [
      {
        title: "Идей много.",
        caption: ["Идей много.", "Начни с одной."],
        art: "idea",
      },
      {
        title: "Одна мысль. Три сцены.",
        caption: ["Одна мысль.", "Три сцены."],
        art: "timeline",
      },
      {
        title: "Твой первый кадр.",
        caption: ["Твой следующий", "первый кадр."],
        art: "play",
      },
    ],
  },
  travel: {
    id: "travel",
    title: "Путешествие",
    description: "За пределами привычного маршрута.",
    scenes: [
      {
        title: "Выйди за кадр.",
        caption: ["Выйди", "за кадр."],
        image: "travel-1.webp",
        alt: "Путешественница в коралловой куртке на белых скалах над синим морем",
      },
      {
        title: "Поверни не туда.",
        caption: ["Поверни", "не туда."],
        image: "travel-2.webp",
        alt: "Солнечная лестница между коралловыми стенами ведёт к морю",
      },
      {
        title: "Найди свою историю.",
        caption: ["Найди свою", "историю."],
        image: "travel-3.webp",
        alt: "Прозрачная синяя вода и светлый каменистый берег с высоты",
      },
    ],
  },
  sport: {
    id: "sport",
    title: "Спорт",
    description: "Движение начинается с одного шага.",
    scenes: [
      {
        title: "Начни с одного шага.",
        caption: ["Начни", "с одного шага."],
        image: "sport-1.webp",
        alt: "Бегун завязывает шнурки на коралловой беговой дорожке",
      },
      {
        title: "Поймай свой ритм.",
        caption: ["Поймай", "свой ритм."],
        image: "sport-2.webp",
        alt: "Спортсмен в синей форме бежит по стадиону",
      },
      {
        title: "Это твоё движение.",
        caption: ["Это твоё", "движение."],
        image: "sport-3.webp",
        alt: "Бегун спокойно идёт по солнечной дорожке после пробежки",
      },
    ],
  },
};

export const storyIds: StoryId[] = ["app", "travel", "sport"];
export const styles: StoryStyle[] = ["calm", "dynamic"];
