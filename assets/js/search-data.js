// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-publications",
          title: "publications",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/publications/";
          },
        },{id: "nav-cv",
          title: "CV",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "books-the-godfather",
          title: 'The Godfather',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/the_godfather/";
            },},{id: "news-joined-seadronix-inc-as-a-robotics-researcher",
          title: 'Joined Seadronix Inc. as a Robotics Researcher.',
          description: "",
          section: "News",},{id: "news-icra-2025-best-paper-award-on-robot-perception-finalist",
          title: 'ICRA 2025 Best Paper Award on Robot Perception – Finalist!',
          description: "",
          section: "News",},{id: "news-moana-paper-published-in-ijrr-cover-article",
          title: 'MOANA paper published in IJRR (Cover Article).',
          description: "",
          section: "News",},{id: "news-xpress-paper-published-in-ra-l",
          title: 'XPRESS paper published in RA-L.',
          description: "",
          section: "News",},{id: "news-m2rdm-paper-published-in-ieee-t-rs",
          title: 'm2rDM paper published in IEEE T-RS.',
          description: "",
          section: "News",},{id: "news-x-factor-accepted-to-ra-l",
          title: 'X-Factor accepted to RA-L.',
          description: "",
          section: "News",},{id: "news-two-papers-presented-at-iccas-2026",
          title: 'Two papers presented at ICCAS 2026.',
          description: "",
          section: "News",},{id: "news-received-the-outstanding-young-researcher-award-at-iccas-2026",
          title: 'Received the Outstanding Young Researcher Award at ICCAS 2026.',
          description: "",
          section: "News",},{id: "teachings-data-science-fundamentals",
          title: 'Data Science Fundamentals',
          description: "This course covers the foundational aspects of data science, including data collection, cleaning, analysis, and visualization. Students will learn practical skills for working with real-world datasets.",
          section: "Teachings",handler: () => {
              window.location.href = "/teachings/data-science-fundamentals/";
            },},{id: "teachings-introduction-to-machine-learning",
          title: 'Introduction to Machine Learning',
          description: "This course provides an introduction to machine learning concepts, algorithms, and applications. Students will learn about supervised and unsupervised learning, model evaluation, and practical implementations.",
          section: "Teachings",handler: () => {
              window.location.href = "/teachings/introduction-to-machine-learning/";
            },},{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
