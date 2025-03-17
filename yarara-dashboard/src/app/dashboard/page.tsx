'use client'
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from "@radix-ui/react-dropdown-menu";
import { LogIn, Eye, Trash2, Folder, User as UserIcon, FileWarning, CircleAlert, Cross, X, Check } from "lucide-react";

import * as Dialog from "@radix-ui/react-dialog"; // Use Radix UI Dialog for consistency
import * as Select from "@radix-ui/react-select"; // Use Radix UI Select for consistency

import githubLogo from "./../../../public/githubLogo.png";
import headStateless from "./../../../public/logoVariants/headStateless.svg";
import mainLogo from "./../../../public/logoVariants/fullWhite.svg";

import { ApiResponse, User, Repository, RepoLanguages, Project } from "@/types/interfaces";
import Image from "next/image";
import { PacmanLoader as Loader } from "react-spinners";
import Link from "next/link";

const isLoggedIn = false; // Simulate authentication state
const projects = ["Project A", "Project B", "Project C"];
const scans = [
  { name: "Scan 1", repo: "Repo A", date: "2024-03-10", vulnerabilities: 3 },
  { name: "Scan 2", repo: "Repo B", date: "2024-03-05", vulnerabilities: 0 }
];


export default function Dashboard() {


  const [search, setSearch] = useState("");
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [repoList, setRepoList] = useState<Repository[]>([]); // Explicitly type the state
  const [logedUser, setLogedUser] = useState<User | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [projectName, setProjectName] = useState("");
  const [repoLanguagesList, setRepoLanguagesList] = useState<RepoLanguages>({});
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project>();
  const [isCollapsed, setIsCollapsed] = useState(false);


  // Effect for refetching the selected project
  useEffect(() => {
    if (!selectedProject?._id) return; // Ensure there's a selected project

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BFF_URL}/api/projects/${logedUser?.id}`);
        const data = await response.json();
        setSelectedProject({
          ...selectedProject,
          scans: data.find((p: any) => p._id == selectedProject._id).scans
        }); // Update project if scans are pending
      } catch (error) {
        console.error("Error refetching project:", error);
      }
    }, 5000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, [selectedProject?._id]); // Runs when selectedProject changes

  // Effect for fetching the logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BFF_URL}/api/user`, { credentials: "include" });
        const data = await response.json();
        setLogedUser(data.user); // Set the logged-in user
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUser();
  }, []);

  // Effect for fetching repositories and projects
  useEffect(() => {
    const fetchReposAndProjects = async () => {
      if (logedUser?.id) {
        try {
          const reposResponse = await fetch(`${process.env.NEXT_PUBLIC_BFF_URL}/api/repos`, { credentials: "include" });
          const reposData = await reposResponse.json();
          setRepoList(reposData);
          console.log(reposData);
          const projectsResponse = await fetch(`${process.env.NEXT_PUBLIC_BFF_URL}/api/projects/${logedUser.id}`);
          const projectsData = await projectsResponse.json();

          const userProjectRepoName = projectsData.map((r: any) => (
            {
              ...r,
              repoName: reposData.find((rLe: any) => rLe.id == r.repoId).name,
              repoUrl: "https://" + logedUser.accessToken + reposData.find((rLe: any) => rLe.id == r.repoId)?.url.replace("https://api.github.com/repos", "@github.com"),
            }));

          console.log("REPOS USER")
          console.log(userProjectRepoName);
          setUserProjects(userProjectRepoName);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };

    fetchReposAndProjects();
  }, [logedUser]);

  // Function to handle adding a scan
  const handleAddScan = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BFF_URL}/api/scans`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: selectedProject?._id,
          repoUrl: selectedProject?.repoUrl,
        }),
      });
      const data = await response.json();
      setSelectedProject(data);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  // Function to handle logout
  const handleLogout = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BFF_URL}/auth/logout`, { credentials: "include" });
      console.log(response);
      setLogedUser(null); // Set the logged-in user
      window.location.href = "/?f"
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // Function to handle adding a project
  const handleAddProject = async () => {
    setLoadingRepos(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BFF_URL}/api/repos`, { credentials: "include" });
      const data = await response.json();
      setRepoList(data); // Set the logged-in user
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoadingRepos(false);
    }
    setOpenProjectDialog(true);
  };

  // Function to handle creating a project
  const handleCreateProject = async () => {
    if (!selectedRepo || !projectName) {
      alert("Please select a repository and provide a project name.");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BFF_URL}/api/projects`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName,
          repoId: selectedRepo,
          scans: [], // Empty list of scans
          userId: logedUser?.id,
        }),
      });
      const data = await response.json();
      console.log("Project created:", data);
      setOpenProjectDialog(false); // Close the dialog
      setSelectedRepo(""); // Reset selected repo
      setProjectName(""); // Reset project name

      const projectsResponse = await fetch(`${process.env.NEXT_PUBLIC_BFF_URL}/api/projects/${logedUser?.id}`);
      const projectsData = await projectsResponse.json();

      const userProjectRepoName = projectsData.map((r: any) => ({
        ...r,
        repoName: repoList.find((rLe: any) => rLe.id == r.repoId)?.name,
        repoUrl: "https://" + logedUser?.accessToken + repoList.find((rLe: any) => rLe.id == r.repoId)?.url.replace("https://api.github.com/repos", "@github.com"),
      }));

      setUserProjects(userProjectRepoName);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  // Effect for fetching repository languages
  useEffect(() => {
    const fetchRepoLanguages = async () => {
      if (selectedRepo !== "") {
        const repo = repoList.find((r) => r.id == selectedRepo);
        if (repo) {
          try {
            const response = await fetch(repo.languages_url, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${logedUser?.accessToken}`,
              },
            });
            const data = await response.json();
            setRepoLanguagesList(data);
          } catch (error) {
            console.log(error);
          }
        }
      }
    };

    fetchRepoLanguages();
  }, [selectedRepo]);


  const getScanColor = (status: string) => {
    if (status == "Pending") return "yellow"
    if (status == "Completed") return "green"
    if (status == "Error") return "red"
    else return "white"
  }

  const totalBytes = Object.values(repoLanguagesList).reduce((sum: number, bytes: number) => sum + bytes, 0);

  const languagesWithPercentages = Object.entries(repoLanguagesList).map(([language, bytes]: [string, number]) => ({
    language,
    percentage: ((bytes / totalBytes) * 100).toFixed(2)
  }));

  return (
    <div className="flex h-screen w-full bg-gray-900 text-gray-200">
      <div className="flex">
        {/* Collapse/Expand Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 bg-gray-800 text-gray-100 hover:bg-gray-700 transition-all duration-200"
        >
          {isCollapsed ? ">" : "<"}
        </button>

        <aside
          className={`bg-gray-800 border-r border-gray-700 transition-all duration-200 ${isCollapsed ? "w-0 overflow-hidden" : "w-64 p-4"
            }`}
        >
          {logedUser && <h2 className="text-xl font-bold mb-6">Projects</h2>}
          {logedUser && <Button
            onClick={handleAddProject}
            className="cursor-pointer mb-5 w-full bg-gray-700 hover:bg-gray-600 text-gray-100 transition-all duration-200"
          >
            Add Project
          </Button>}
          <ul className="space-y-2">
            {userProjects.map((project, index) => (
              <li
                key={index}
                onClick={() => setSelectedProject(project)}
                style={{ background: selectedProject?._id === project._id ? "#00b40044" : "" }}
                className="flex items-center p-2 gap-2 hover:bg-gray-700 cursor-pointer rounded-md transition-colors duration-200"
              >
                <Folder size={16} className="text-gray-300" />
                <span>{project.name}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="flex-1 flex flex-col ">
        <header className="flex justify-between items-center bg-gray-800 shadow-lg p-4">
          <div className="flex items-center gap-2">
            <Image src={mainLogo.src} alt="main-logo" height={200} width={120}></Image>
          </div>
          <div>
            {logedUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="flex items-center gap-2">
                    <Image className="rounded-full" height={40} width={40} alt="profile" src={logedUser.photos[0].value} />
                    <Badge className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600">
                      User {logedUser.displayName} ▼
                    </Badge>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 border border-gray-700 rounded-md shadow-lg">
                  <DropdownMenuItem className="cursor-pointer p-2 hover:bg-gray-700">Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer  p-2 hover:bg-gray-700">Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => window.location.href = "http://localhost:5000/auth/github"}
                className="flex gap-2 bg-gray-700 hover:bg-gray-600 text-gray-100 transition-all duration-200"
              >
                <LogIn size={16} /> Login with GitHub
              </Button>
            )}
          </div>
        </header>

        <main className="p-6 ">
          {selectedProject && <div className="mb-4 font-bold">Repository: {selectedProject.repoName}</div>}

          <div className="flex justify-between mb-6 ">
            {/* <Input
              placeholder="Search scans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-1/3 bg-gray-700 border-gray-600 focus:ring-gray-500 rounded-md transition-all duration-200"
            /> */}
            <div></div>
            {selectedProject && <Button
              onClick={handleAddScan}
              className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-gray-100 transition-all duration-200"
            >
              Add New Scan
            </Button>}
          </div>

          {!selectedProject &&
            <div style={{
              display: 'flex', alignItems: 'center',
              flexDirection: 'column', justifyItems: 'center',
              height: "60vh", justifyContent: 'center', width: "100%", gap: 20
            }}>
              <Image height={150} width={150} alt="stateless-logo" src={headStateless}></Image>
              <h5 style={{ fontWeight: "bold", fontSize: 25, color: "#37465c" }}>Create a new project or select an existing one</h5>
            </div>
          }
          {selectedProject && <Card className="p-4 bg-gray-800 rounded-lg shadow-sm">
            <table className="w-full border-collapse bg-gray-800">
              <thead className="bg-gray-800">
                <tr className="bg-gray-700">
                  <th className="p-3 text-left text-gray-200">Name</th>
                  <th className="p-3 text-left text-gray-200">Repository</th>
                  <th className="p-3 text-left text-gray-200">Scan Date</th>
                  <th className="p-3 text-left text-gray-200">Vulnerabilities</th>
                  <th className="p-3 text-left text-gray-200">Status</th>
                  <th className="p-3 text-left text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody >
                {selectedProject?.scans.map((scan, index) => (
                  <tr key={index} className="border-b border-gray-700 hover:bg-gray-700 transition-colors duration-200">
                    <td className="p-3">{index}</td>
                    <td className="p-3">{selectedProject.repoName}</td>
                    <td className="p-3">{new Date(scan.scanDate).toLocaleString("es")}</td>
                    <td className="p-3">{scan.vulnerabilitiesCount || 0}</td>
                    <td className="p-3" style={{ color: getScanColor(scan.status) }}>
                      <div className="flex gap-2 items-center">
                        {scan.status === "Pending" && "Scanning "}
                        {scan.status === "Pending" && <Loader color="yellow" size={10} />}
                        {scan.status === "Completed" && <Check color="green" size={20} />}
                        {scan.status === "Error" && <X color="red" size={20} />}
                      </div>
                    </td>
                    <td className="p-3 flex gap-2">
                      <Link href={`/scan/${scan._id}`}>
                        {scan.status === "Completed" && <Eye size={20} className="cursor-pointer text-gray-400 hover:text-gray-200 transition-colors duration-200" />}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </Card>}
        </main>
      </div>

      <Dialog.Root open={openProjectDialog} onOpenChange={setOpenProjectDialog}>
        <Dialog.Trigger asChild>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" /> {/* Overlay for modal */}
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <Dialog.Title className="text-xl font-bold mb-4">Create New Project</Dialog.Title>
            <Dialog.Description className="mb-4">
              Select a repository and provide a name for your project.
            </Dialog.Description>
            <div className="space-y-4">
              <Select.Root value={selectedRepo} onValueChange={setSelectedRepo}>
                <Select.Trigger className="w-full p-2 bg-gray-700 rounded-md">
                  <Select.Value placeholder="Select a repository">
                    {repoList.find((repo) => repo.id == selectedRepo)?.name || "Select a repository"}
                  </Select.Value>


                </Select.Trigger>
                <Select.Portal>
                  <Select.Content
                    className="max-h-60 w-100 bg-gray-800 border border-gray-700 rounded-md shadow-lg"
                    position="popper" // Ensures it's positioned relative to the trigger
                  >
                    <Select.Viewport className="max-h-60 w-full  overflow-y-auto">
                      {repoList.map((repo) => (
                        <Select.Item key={repo.id} value={repo.id} className="cursor-pointer w-full p-2 hover:bg-gray-700">
                          <div className="flex justify-between w-full">
                            <Image alt="github-logo" width={20} height={1} src={githubLogo.src} />
                            {repo.name}
                          </div>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
              <Input
                placeholder="Project Name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded-md"
              />
            </div>
            <div>
              <div style={{ padding: 10 }}>
                {languagesWithPercentages.map(({ language, percentage }) => (
                  <div key={language}>
                    {language}: {percentage}%
                  </div>
                ))}
              </div>
              {selectedRepo && !languagesWithPercentages.some(({ language }) => language == "Clarity") && (
                <Dialog.Description style={{ color: 'yellow', display: "flex", flexDirection: 'row', gap: 10 }}>
                  <CircleAlert />
                  Warning: Clarity language is missing!
                </Dialog.Description>
              )}

            </div>
            <Dialog.Close asChild>
              <Button onClick={() => handleCreateProject()}
                disabled={!languagesWithPercentages.some(({ language }) => language == "Clarity")}
                className={(projectName != "" && !languagesWithPercentages.some(({ language }) => language == "Clarity")) ?
                  "cursor-not-allowed mb-5 w-full bg-gray-500 text-gray-300 transition-all duration-200 mt-4 disabled:bg-gray-400 disabled:text-gray-200 disabled:opacity-50 disabled:hover:bg-gray-400" :
                  "cursor-pointer mb-5 w-full bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-gray-100 transition-all duration-200 mt-4"
                }>
                Create Project
              </Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>

  );
}