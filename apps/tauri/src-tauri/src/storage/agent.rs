use super::{entities, Storage};

impl Storage {
    /// ### return all agents, if no agents, create default agent and return it
    pub async fn get_all_agents(&self) -> Result<Vec<entities::Agent>, String> {
        let agent_ids: Vec<String> = self.list_dirs(&["agent"]).await.unwrap_or_default();

        if agent_ids.is_empty() {
            // create default agent
            let agent = entities::Agent::default();
            self.create_agent(&agent).await?;
            return Ok(vec![agent]);
        }

        let mut agents = Vec::new();
        for id in agent_ids {
            let agent = self.read(&["agent", &id, "info"]).await?;
            agents.push(agent);
        }

        Ok(agents)
    }

    pub async fn get_agent(&self, id: &str) -> Result<entities::Agent, String> {
        self.read(&["agent", id, "info"]).await
    }

    pub async fn create_agent(&self, agent: &entities::Agent) -> Result<(), String> {
        self.write(&["agent", &agent.id, "info"], agent).await
    }

    pub async fn update_agent(&self, agent: &entities::Agent) -> Result<(), String> {
        self.write(&["agent", &agent.id, "info"], agent).await
    }

    pub async fn delete_agent(&self, id: &str) -> Result<(), String> {
        let agents = self.get_all_agents().await?;
        if agents.len() <= 1 {
            return Err("Cannot delete the last agent".to_string());
        }

        self.remove_dir(&["agent", id]).await
    }
}
